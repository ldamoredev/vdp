import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

import { Core } from './modules/Core';
import { AuditLogRepository } from './modules/common/base/auth/AuditLogRepository';
import { SessionRepository } from './modules/common/base/auth/SessionRepository';
import { UserRepository } from './modules/common/base/auth/UserRepository';
import { AuthService } from './modules/common/auth/AuthService';
import { HttpController } from './modules/common/http/HttpController';
import { AuthController } from './modules/common/http/AuthController';
import { RequestAuditLogger } from './modules/common/http/RequestAuditLogger';
import { HttpSessionAuthentication } from './modules/common/http/HttpSessionAuthentication';
import { StatusController } from './modules/common/http/StatusController';
import { httpErrorHandler } from './modules/common/http/errors';
import { AuthContextStorage } from './modules/common/auth/AuthContextStorage';

export class App {
    public app = Fastify({ logger: true });
    private stopPromise: Promise<void> | null = null;
    private readonly authService: AuthService;
    private readonly sessionAuthentication: HttpSessionAuthentication;
    private readonly requestAuditLogger: RequestAuditLogger;

    constructor(public readonly core: Core) {
        this.authService = new AuthService(
            this.core.getRepository(UserRepository),
            this.core.getRepository(SessionRepository),
            this.core.getRepository(AuditLogRepository),
        );
        this.sessionAuthentication = new HttpSessionAuthentication(this.authService, this.core.getAuthContextStorage());
        this.requestAuditLogger = new RequestAuditLogger(this.core.getRepository(AuditLogRepository), this.core.getAuthContextStorage());
        this.registerPlugins();
        this.registerControllers();
        this.registerTimelineLogging();
    }

    private registerPlugins() {
        const allowedOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
            : true;

        this.app.register(cors, { origin: allowedOrigins });
        this.app.register(helmet, { contentSecurityPolicy: false });
        this.app.register(rateLimit, {
            max: 100,
            timeWindow: '1 minute',
        });
        void this.sessionAuthentication.plugin(this.app);
        void this.requestAuditLogger.plugin(this.app);
        this.app.setErrorHandler(httpErrorHandler);
    }

    private registerControllers() {
        const controllers: HttpController[] = [
            new StatusController(this.core.agentRegistry, this.core.getModuleDescriptors()),
            new AuthController(this.authService),
            ...this.core.getControllers(),
        ];

        for (const controller of controllers) {
            controller.register(this.app);
        }
    }

    private registerTimelineLogging() {
        this.core.eventBus.onAll((event) => {
            this.app.log.info(
                {
                    event: `${event.domain}.${event.type}`,
                    timestamp: event.timestamp.toISOString(),
                },
                'timeline event',
            );
        });
    }

    async start(port: number, host: string) {
        await this.core.start();
        try {
            await this.app.listen({
                port,
                host,
            });
            this.logStartup(port);
        } catch (error) {
            await this.core.shutdown();
            throw error;
        }
    }

    async stop(err?: unknown): Promise<void> {
        if (err) this.app.log.error(err);
        if (!this.stopPromise) {
            this.stopPromise = Promise.allSettled([
                this.app.close(),
                this.core.shutdown(),
            ]).then(() => undefined);
        }

        return this.stopPromise;
    }

    private logStartup(port: number): void {
        this.app.log.info({
            message: 'VDP Server listening',
            port,
            health: `http://localhost:${port}/api/health`,
            activeModules: this.activeModules(),
        });
    }

    private activeModules(): string {
        return this.core
            .getModuleDescriptors()
            .map((module) => module.label)
            .join(', ');
    }
}
