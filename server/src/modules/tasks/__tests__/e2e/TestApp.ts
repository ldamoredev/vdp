import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { Core } from '../../../Core';
import { httpErrorHandler } from '../../../common/http/errors';

/**
 * Lightweight Fastify app wired to the test database.
 * Builds Fastify directly (logger: false) to avoid pino blocking
 * in forked Vitest processes.
 */
export class TestApp {
    public app!: FastifyInstance;
    public core!: Core;

    async setup() {
        process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/vdp_test';

        this.core = new Core();
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
