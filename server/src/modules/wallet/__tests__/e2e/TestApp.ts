import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { Core } from '../../../Core';
import { httpErrorHandler } from '../../../common/http/errors';
import { AuthContextStorage } from '../../../auth/infrastructure/http/AuthContextStorage';
import { TestCoreConfiguration } from './TestCoreConfiguration';
import { getTestUser, PRIMARY_TEST_USER, TEST_USER_ID_HEADER } from '../../../../test/testUsers';

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
            const requestedUserId = request.headers[TEST_USER_ID_HEADER];
            const user = getTestUser(
                typeof requestedUserId === 'string' && requestedUserId ? requestedUserId : PRIMARY_TEST_USER.id,
            );
            const authContext = {
                isAuthenticated: true,
                userId: user.id,
                sessionId: 'test-session',
                role: 'user' as const,
                email: user.email,
                displayName: user.displayName,
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
