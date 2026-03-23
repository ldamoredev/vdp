import Fastify from 'fastify';
import cors from '@fastify/cors';

import { Core } from './modules/Core';
import { HttpController } from './modules/common/http/HttpController';
import { StatusController } from './modules/common/http/StatusController';
import { httpErrorHandler } from './modules/common/http/errors';

export class App {
    public app = Fastify({ logger: true });
    private stopPromise: Promise<void> | null = null;

    constructor(public readonly core: Core) {
        this.registerPlugins();
        this.registerControllers();
        this.registerTimelineLogging();
    }

    private registerPlugins() {
        this.app.register(cors, { origin: true });
        this.app.setErrorHandler(httpErrorHandler);
    }

    private registerControllers() {
        const controllers: HttpController[] = [
            new StatusController(this.core.agentRegistry, this.core.getModuleDescriptors()),
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
            this.logStartup(port)
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
