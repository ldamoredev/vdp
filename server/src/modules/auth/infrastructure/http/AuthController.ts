import { z } from 'zod';

import { GetSetupStatus } from '../../services/GetSetupStatus';
import { RegisterUser } from '../../services/RegisterUser';
import { LoginUser } from '../../services/LoginUser';
import { LogoutUser } from '../../services/LogoutUser';
import { UpdateProfile } from '../../services/UpdateProfile';
import { ChangePassword } from '../../services/ChangePassword';
import { GetSecurityOverview } from '../../services/GetSecurityOverview';
import { LogoutOtherSessions } from '../../services/LogoutOtherSessions';
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

const updateProfileSchema = z.object({
    displayName: z.string().trim().min(1).max(120),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(8).max(200),
    newPassword: z.string().min(8).max(200),
});

type RegisterBody = z.infer<typeof registerSchema>;
type LoginBody = z.infer<typeof loginSchema>;
type UpdateProfileBody = z.infer<typeof updateProfileSchema>;
type ChangePasswordBody = z.infer<typeof changePasswordSchema>;

export class AuthController extends HttpController {
    readonly prefix = '/api/auth';

    constructor(
        private readonly getSetupStatus: GetSetupStatus,
        private readonly registerUser: RegisterUser,
        private readonly loginUser: LoginUser,
        private readonly logoutUser: LogoutUser,
        private readonly updateProfile: UpdateProfile,
        private readonly changePassword: ChangePassword,
        private readonly getSecurityOverview: GetSecurityOverview,
        private readonly logoutOtherSessions: LogoutOtherSessions,
    ) {
        super();
    }

    registerRoutes(routes: RouteRegister): void {
        routes
            .get('/setup', {}, this.setup)
            .get('/me', {}, this.me)
            .get('/security', {}, this.security)
            .post('/register', { body: registerSchema }, this.handleRegister)
            .post('/login', { body: loginSchema }, this.login)
            .post('/logout', {}, this.logout)
            .post('/logout-others', {}, this.logoutOthers)
            .patch('/profile', { body: updateProfileSchema }, this.profile)
            .post('/change-password', { body: changePasswordSchema }, this.password);
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
        const token = this.extractSessionToken(request);
        if (token) {
            await this.logoutUser.execute(token);
        }

        return reply.send({ ok: true });
    };

    private readonly profile: RouteContextHandler<undefined, undefined, UpdateProfileBody> = async ({
        request,
        body,
        reply,
    }) => {
        const auth = request.auth;

        if (!auth.isAuthenticated || !auth.userId) {
            throw new UnauthorizedHttpError('Not authenticated');
        }

        const user = await this.updateProfile.execute({
            userId: auth.userId,
            sessionId: auth.sessionId,
            displayName: body!.displayName,
        });

        return reply.send({ user });
    };

    private readonly password: RouteContextHandler<undefined, undefined, ChangePasswordBody> = async ({
        request,
        body,
        reply,
    }) => {
        const auth = request.auth;

        if (!auth.isAuthenticated || !auth.userId) {
            throw new UnauthorizedHttpError('Not authenticated');
        }

        await this.changePassword.execute({
            userId: auth.userId,
            sessionId: auth.sessionId,
            currentPassword: body!.currentPassword,
            newPassword: body!.newPassword,
        });

        return reply.send({ ok: true });
    };

    private readonly security: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        const auth = request.auth;

        if (!auth.isAuthenticated || !auth.userId) {
            throw new UnauthorizedHttpError('Not authenticated');
        }

        return reply.send(await this.getSecurityOverview.execute({
            userId: auth.userId,
            currentSessionId: auth.sessionId,
        }));
    };

    private readonly logoutOthers: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        const auth = request.auth;

        if (!auth.isAuthenticated || !auth.userId) {
            throw new UnauthorizedHttpError('Not authenticated');
        }

        return reply.send(await this.logoutOtherSessions.execute({
            userId: auth.userId,
            currentSessionId: auth.sessionId,
        }));
    };

    private extractSessionToken(request: { headers: Record<string, string | string[] | undefined> }): string | null {
        const headerToken = request.headers['x-session-token'];
        if (typeof headerToken === 'string' && headerToken) {
            return headerToken;
        }

        const cookieHeader = request.headers.cookie;
        if (typeof cookieHeader !== 'string' || !cookieHeader) return null;

        const match = cookieHeader.match(/(?:^|;\s*)vdp_session=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    }
}
