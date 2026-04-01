import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { Core } from '../../../Core';
import { httpErrorHandler } from '../../../common/http/errors';
import { TestCoreConfiguration } from './TestCoreConfiguration';

export class TestApp {
    public app!: FastifyInstance;
    public core!: Core;

    async setup() {
        this.core = new Core(new TestCoreConfiguration());
        this.app = Fastify({ logger: false });

        await this.app.register(cors, { origin: true });
        this.app.setErrorHandler(httpErrorHandler);

        for (const controller of this.core.getControllers()) {
            await controller.register(this.app);
        }

        await this.app.ready();
    }

    async teardown() {
        await this.app.close();
    }
}
