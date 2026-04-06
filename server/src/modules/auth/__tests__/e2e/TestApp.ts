import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

import { Core } from '../../../Core';
import { httpErrorHandler } from '../../../common/http/errors';
import { HttpController } from '../../../common/http/HttpController';
import { HttpMiddleWare } from '../../../common/http/HttpMiddleWare';
import { TestCoreConfiguration } from './TestCoreConfiguration';

export class TestApp {
    public app!: FastifyInstance;
    public core!: Core;

    async setup() {
        const config = new TestCoreConfiguration();
        this.core = new Core(config);
        this.app = Fastify({ logger: false });

        await this.app.register(cors, { origin: true });
        this.app.setErrorHandler(httpErrorHandler);

        const middlewares: HttpMiddleWare[] = this.core.getMiddlewares();
        for (const middleware of middlewares) {
            await middleware.plugin(this.app);
        }

        const controllers: HttpController[] = this.core.getControllers();
        for (const controller of controllers) {
            await controller.register(this.app);
        }

        await this.app.ready();
    }

    async teardown() {
        await this.app.close();
    }
}
