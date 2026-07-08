import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { Core } from '../../../Core';
import { httpErrorHandler } from '../../../common/http/errors';
import { TasksTestCoreConfiguration } from './TasksTestCoreConfiguration';
import { getTestUser, PRIMARY_TEST_USER, TEST_USER_ID_HEADER } from '../../../../test/testUsers';

export class TasksTestApp {
    public app!: FastifyInstance;
    public core!: Core;

    async setup() {
        const config = new TasksTestCoreConfiguration();
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
                role: user.role ?? 'user',
                email: user.email,
                displayName: user.displayName,
            };
            request.auth = authContext;
            config.authContextStorage.setAuthContext({ ...authContext });
        });

        for (const controller of this.core.getControllers()) {
            await controller.register(this.app);
        }

        await this.core.start();
        await this.app.ready();
    }

    async teardown() {
        await this.app.close();
    }
}
