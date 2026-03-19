import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { Core } from '../../../Core';
import { TasksController } from '../../infraestructure/routes/TasksController';
import { TaskInsightsSSEController } from '../../infraestructure/routes/TaskInsightsSSEController';

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

        const tasksController = new TasksController(this.app, this.core);
        await this.app.register(tasksController.plugin, { prefix: '/api/v1/tasks' });

        const taskInsightsSSE = new TaskInsightsSSEController(
            this.core.sseBroadcaster,
            this.core.taskModule.insightsStore,
        );
        await this.app.register(taskInsightsSSE.plugin, { prefix: '/api/v1/tasks/insights' });

        await this.app.ready();
    }

    async teardown() {
        await this.app.close();
    }
}
