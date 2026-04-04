import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { Core } from '../../../Core';
import { httpErrorHandler } from '../../../common/http/errors';
import { TestCoreConfiguration } from './TestCoreConfiguration';

const DEFAULT_TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Lightweight Fastify app wired to the test database.
 * Builds Fastify directly (logger: false) to avoid pino blocking
 * in forked Vitest processes.
 */
export class TestApp {
    public app!: FastifyInstance;
    public core!: Core;

    async setup() {
        const config = new TestCoreConfiguration();
        this.core = new Core(config);
        this.app = Fastify({ logger: false });

        await this.app.register(cors, { origin: true });
        this.app.setErrorHandler(httpErrorHandler);

        this.app.addHook('preHandler', async (request) => {
            const authContext = {
                isAuthenticated: true,
                userId: DEFAULT_TEST_USER_ID,
                sessionId: 'test-session',
                role: 'user' as const,
                email: 'test@vdp.local',
                displayName: 'Test User',
            };
            request.auth = authContext;
            config.authContextStorage.setAuthContext({ ...authContext });
        });

        for (const controller of this.core.getControllers()) {
            await controller.register(this.app);
        }

        await this.app.ready();
    }

    async teardown() {
        await this.app.close();
    }
}
