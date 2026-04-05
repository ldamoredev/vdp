import { z } from 'zod';

import { GetSetupStatus } from '../../services/GetSetupStatus';
import { RegisterUser } from '../../services/RegisterUser';
import { LoginUser } from '../../services/LoginUser';
import { LogoutUser } from '../../services/LogoutUser';
import { HttpController, RouteRegister } from '../../../common/http/HttpController';
import { RouteContextHandler } from '../../../common/http/routes';
import { UnauthorizedHttpError } from '../../../common/http/errors';

const registerSchema = z.object({
    email: z.string().trim().email(),
    displayName: z.string().trim().min(1).max(120),
    password: z.string().min(8).max(200),
});

const loginSchema = z.object({
    email: z.string().trim().email(),
    password: z.string().min(8).max(200),
});

type RegisterBody = z.infer<typeof registerSchema>;
type LoginBody = z.infer<typeof loginSchema>;

export class AuthController extends HttpController {
    readonly prefix = '/api/auth';

    constructor(
        private readonly getSetupStatus: GetSetupStatus,
        private readonly registerUser: RegisterUser,
        private readonly loginUser: LoginUser,
        private readonly logoutUser: LogoutUser,
    ) {
        super();
    }

    registerRoutes(routes: RouteRegister): void {
        routes
            .get('/setup', {}, this.setup)
            .get('/me', {}, this.me)
            .post('/register', { body: registerSchema }, this.handleRegister)
            .post('/login', { body: loginSchema }, this.login)
            .post('/logout', {}, this.logout);
    }

    private readonly setup: RouteContextHandler<undefined, undefined, undefined> = async ({ reply }) => {
        return reply.send(await this.getSetupStatus.execute());
    };

    private readonly me: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        const auth = request.auth;

        if (!auth.isAuthenticated || !auth.userId) {
            throw new UnauthorizedHttpError('Not authenticated');
        }

        return reply.send({
            user: {
                id: auth.userId,
                email: auth.email,
                displayName: auth.displayName,
                role: auth.role,
            },
        });
    };

    private readonly handleRegister: RouteContextHandler<undefined, undefined, RegisterBody> = async ({
        body,
        reply,
    }) => {
        const result = await this.registerUser.execute({
            email: body!.email,
            displayName: body!.displayName,
            password: body!.password,
        });

        return reply.send(result);
    };

    private readonly login: RouteContextHandler<undefined, undefined, LoginBody> = async ({
        request,
        body,
        reply,
    }) => {
        const result = await this.loginUser.execute({
            email: body!.email,
            password: body!.password,
            userAgent: request.headers['user-agent'] ?? null,
            ipAddress: request.ip ?? null,
        });

        return reply.send(result);
    };

    private readonly logout: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        const token = request.headers['x-session-token'];
        if (typeof token === 'string' && token) {
            await this.logoutUser.execute(token);
        }

        return reply.send({ ok: true });
    };
}
