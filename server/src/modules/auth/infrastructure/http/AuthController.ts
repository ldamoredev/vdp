import { z } from 'zod';
import { CQBus } from '@nbottarini/cqbus';

import { executionContextFromAuth } from '../../../common/app/auth/AuthExecutionContext';
import { HttpController, RouteRegister } from '../../../common/http/HttpController';
import { RouteContextHandler } from '../../../common/http/routes';
import { ChangePasswordCommand } from '../../app/ChangePasswordCommand';
import { GetCurrentUserQuery } from '../../app/GetCurrentUserQuery';
import { GetSecurityOverviewQuery } from '../../app/GetSecurityOverviewQuery';
import { GetSetupStatusQuery } from '../../app/GetSetupStatusQuery';
import { LoginUserCommand } from '../../app/LoginUserCommand';
import { LogoutOtherSessionsCommand } from '../../app/LogoutOtherSessionsCommand';
import { LogoutUserCommand } from '../../app/LogoutUserCommand';
import { RegisterUserCommand } from '../../app/RegisterUserCommand';
import { UpdateProfileCommand } from '../../app/UpdateProfileCommand';
import {
    SESSION_COOKIE_NAME,
    sessionCookieClearOptions,
    sessionCookieOptions,
} from './session-cookie';

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

    constructor(private readonly bus: CQBus) {
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
        return reply.send(await this.bus.execute(new GetSetupStatusQuery()));
    };

    private readonly me: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(new GetCurrentUserQuery(), executionContextFromAuth(request.auth)),
        );
    };

    private readonly handleRegister: RouteContextHandler<undefined, undefined, RegisterBody> = async ({
        body,
        reply,
    }) => {
        const result = await this.bus.execute(new RegisterUserCommand({
            email: body!.email,
            displayName: body!.displayName,
            password: body!.password,
        }));

        reply.setCookie(SESSION_COOKIE_NAME, result.sessionToken, sessionCookieOptions());
        return reply.send(result);
    };

    private readonly login: RouteContextHandler<undefined, undefined, LoginBody> = async ({
        request,
        body,
        reply,
    }) => {
        const result = await this.bus.execute(new LoginUserCommand({
            email: body!.email,
            password: body!.password,
            userAgent: request.headers['user-agent'] ?? null,
            ipAddress: request.ip ?? null,
        }));

        reply.setCookie(SESSION_COOKIE_NAME, result.sessionToken, sessionCookieOptions());
        return reply.send(result);
    };

    private readonly logout: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        await this.bus.execute(new LogoutUserCommand(this.extractSessionToken(request)));

        reply.clearCookie(SESSION_COOKIE_NAME, sessionCookieClearOptions());
        return reply.send({ ok: true });
    };

    private readonly profile: RouteContextHandler<undefined, undefined, UpdateProfileBody> = async ({
        request,
        body,
        reply,
    }) => {
        const user = await this.bus.execute(new UpdateProfileCommand({
            displayName: body!.displayName,
        }), executionContextFromAuth(request.auth));

        return reply.send({ user });
    };

    private readonly password: RouteContextHandler<undefined, undefined, ChangePasswordBody> = async ({
        request,
        body,
        reply,
    }) => {
        await this.bus.execute(new ChangePasswordCommand({
            currentPassword: body!.currentPassword,
            newPassword: body!.newPassword,
        }), executionContextFromAuth(request.auth));

        // Password change revokes sessions; clear the cookie so the browser re-logs.
        reply.clearCookie(SESSION_COOKIE_NAME, sessionCookieClearOptions());
        return reply.send({ ok: true });
    };

    private readonly security: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(new GetSecurityOverviewQuery(), executionContextFromAuth(request.auth)),
        );
    };

    private readonly logoutOthers: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(new LogoutOtherSessionsCommand(), executionContextFromAuth(request.auth)),
        );
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
