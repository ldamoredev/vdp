import fs from 'node:fs';
import path from 'node:path';

import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import multipart from '@fastify/multipart';

import { Core } from './modules/Core';
import { MAX_FILE_BYTES } from './modules/health/domain/medical/file-validation';
import { HttpController } from './modules/common/http/HttpController';
import { StatusController } from './modules/common/http/StatusController';
import { httpErrorHandler } from './modules/common/http/errors';
import { HttpMiddleWare } from './modules/common/http/HttpMiddleWare';

export class App {
    public app = Fastify({ logger: true });
    private stopPromise: Promise<void> | null = null;

    constructor(public readonly core: Core) {
        this.registerPlugins();
        this.registerMiddlewares();
        this.registerControllers();
        this.registerSpaStatic();
        this.registerTimelineLogging();
    }

    private registerPlugins() {
        const allowedOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
            : ['http://localhost:3000'];

        this.app.register(cookie);
        this.app.register(cors, { origin: allowedOrigins });
        this.app.register(helmet, { contentSecurityPolicy: false });
        // File uploads (medical attachments). One file per request, hard byte
        // cap mirrored by the domain validator; the route reads request.file().
        this.app.register(multipart, {
            limits: { fileSize: MAX_FILE_BYTES, files: 1, fields: 4 },
        });
        this.app.register(rateLimit, {
            // With the SPA talking to the API directly (no BFF coalescing requests),
            // a fast navigation burst legitimately exceeds the old 100/min budget.
            max: Number(process.env.RATE_LIMIT_MAX) || 300,
            timeWindow: '1 minute',
            // SPA assets are served from this same process; only the API needs limiting.
            allowList: (request) => request.url !== '/api' && !request.url.startsWith('/api/'),
        });
        this.app.setErrorHandler(httpErrorHandler);
    }

    // Production serves the web SPA build from this process (same-origin with the
    // API, so the session cookie needs no proxy). No-op when the build is absent
    // (local dev uses the Vite dev server with an /api proxy instead).
    private registerSpaStatic() {
        const distPath = process.env.WEB_DIST_PATH
            ? path.resolve(process.env.WEB_DIST_PATH)
            : path.resolve(process.cwd(), '../apps/web/dist');

        if (!fs.existsSync(path.join(distPath, 'index.html'))) return;

        this.app.register(fastifyStatic, {
            root: distPath,
            index: 'index.html',
            cacheControl: false,
            setHeaders: (res, filePath) => {
                if (filePath.includes(`${path.sep}assets${path.sep}`)) {
                    // Vite emits content-hashed filenames under assets/.
                    res.setHeader('cache-control', 'public, max-age=31536000, immutable');
                } else {
                    res.setHeader('cache-control', 'public, max-age=0');
                }
            },
        });

        this.app.setNotFoundHandler((request, reply) => {
            if (request.url === '/api' || request.url.startsWith('/api/')) {
                return reply.status(404).send({
                    message: `Route ${request.method}:${request.url} not found`,
                    error: 'Not Found',
                    statusCode: 404,
                });
            }
            return reply.sendFile('index.html');
        });

        this.app.log.info({ distPath }, 'Serving web SPA build');
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

    private registerMiddlewares() {
        const middlewares: HttpMiddleWare[] = [
            ...this.core.getMiddlewares(),
        ];

        for (const middleware of middlewares) {
            void middleware.plugin(this.app);
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
