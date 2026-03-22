import Fastify from 'fastify';
import cors from '@fastify/cors';

import { Core } from './modules/Core';
import { HttpController } from './modules/common/http/HttpController';
import { StatusController } from './modules/common/http/StatusController';
import { httpErrorHandler } from './modules/common/http/errors';

export class App {
    public app = Fastify({ logger: true });

    constructor(private core: Core) {
        this.registerPlugins();
        this.registerControllers();
        this.events();
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

    private events() {
        this.core.eventBus.onAll((event) => {
            console.log(`[TIMELINE] ${event.domain}.${event.type} at ${event.timestamp.toISOString()}`);
        });
    }

    async start(param: { port: number; host: string }) {
        await this.core.start();
        await this.app.listen(param);
    }

    async stop() {
        return async () => {
            await Promise.allSettled([() => this.app.close(), this.core.shutdown()]);
        }
    }
}
