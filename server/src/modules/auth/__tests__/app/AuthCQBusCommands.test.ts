import { describe, expect, it, vi } from 'vitest';

import { AuthContext } from '../../../common/http/AuthContext';
import { UserIdentity } from '../../../common/app/auth/UserIdentity';
import { AuthenticatedUser } from '../../services/AuthenticatedUser';
import { ChangePasswordCommand, ChangePasswordCommandHandler } from '../../app/ChangePasswordCommand';
import { GetCurrentUserQuery, GetCurrentUserQueryHandler } from '../../app/GetCurrentUserQuery';
import { GetSecurityOverviewQuery, GetSecurityOverviewQueryHandler } from '../../app/GetSecurityOverviewQuery';
import { LoginUserCommand, LoginUserCommandHandler } from '../../app/LoginUserCommand';
import { LogoutOtherSessionsCommand, LogoutOtherSessionsCommandHandler } from '../../app/LogoutOtherSessionsCommand';
import { LogoutUserCommand, LogoutUserCommandHandler } from '../../app/LogoutUserCommand';
import { RegisterUserCommand, RegisterUserCommandHandler } from '../../app/RegisterUserCommand';
import { UpdateProfileCommand, UpdateProfileCommandHandler } from '../../app/UpdateProfileCommand';

const authContext: AuthContext = {
    isAuthenticated: true,
    userId: 'user-1',
    sessionId: 'session-1',
    role: 'user',
    email: 'test@example.com',
    displayName: 'Test User',
};

const identity = UserIdentity.fromAuthContext(authContext)!;

const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'user',
};

describe('auth CQBus commands', () => {
    it('preserves the current session id in UserIdentity', () => {
        expect(identity.userId).toBe('user-1');
        expect(identity.sessionId).toBe('session-1');
    });

    it('returns the current user from identity', async () => {
        const result = await new GetCurrentUserQueryHandler().handle(new GetCurrentUserQuery(), identity);

        expect(result).toEqual({
            user: {
                id: 'user-1',
                email: 'test@example.com',
                displayName: 'Test User',
                role: 'user',
            },
        });
    });

    it('forwards public register/login/logout data without caller identity', async () => {
        const register = { execute: vi.fn().mockResolvedValue({ sessionToken: 'session-token', user }) };
        const login = { execute: vi.fn().mockResolvedValue({ sessionToken: 'login-token', user }) };
        const logout = { execute: vi.fn().mockResolvedValue(undefined) };

        await new RegisterUserCommandHandler(register as never).handle(
            new RegisterUserCommand({ email: 'TEST@example.com', displayName: 'Test User', password: 'password123' }),
        );
        await new LoginUserCommandHandler(login as never).handle(
            new LoginUserCommand({
                email: 'test@example.com',
                password: 'password123',
                userAgent: 'Vitest',
                ipAddress: '127.0.0.1',
            }),
        );
        await new LogoutUserCommandHandler(logout as never).handle(new LogoutUserCommand('session-token'));

        expect(register.execute).toHaveBeenCalledWith({
            email: 'TEST@example.com',
            displayName: 'Test User',
            password: 'password123',
        });
        expect(login.execute).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
            userAgent: 'Vitest',
            ipAddress: '127.0.0.1',
        });
        expect(logout.execute).toHaveBeenCalledWith('session-token');
    });

    it('derives user and current session identity for protected mutations', async () => {
        const updateProfile = { execute: vi.fn().mockResolvedValue(user) };
        const changePassword = { execute: vi.fn().mockResolvedValue(undefined) };
        const logoutOthers = { execute: vi.fn().mockResolvedValue({ revokedSessions: 2 }) };

        await new UpdateProfileCommandHandler(updateProfile as never)
            .handle(new UpdateProfileCommand({ displayName: 'New Name' }), identity);
        await new ChangePasswordCommandHandler(changePassword as never)
            .handle(new ChangePasswordCommand({ currentPassword: 'old-pass-123', newPassword: 'new-pass-123' }), identity);
        const result = await new LogoutOtherSessionsCommandHandler(logoutOthers as never)
            .handle(new LogoutOtherSessionsCommand(), identity);

        expect(updateProfile.execute).toHaveBeenCalledWith({
            userId: 'user-1',
            sessionId: 'session-1',
            displayName: 'New Name',
        });
        expect(changePassword.execute).toHaveBeenCalledWith({
            userId: 'user-1',
            sessionId: 'session-1',
            currentPassword: 'old-pass-123',
            newPassword: 'new-pass-123',
        });
        expect(logoutOthers.execute).toHaveBeenCalledWith({
            userId: 'user-1',
            currentSessionId: 'session-1',
        });
        expect(result).toEqual({ revokedSessions: 2 });
    });

    it('derives identity for the security overview query', async () => {
        const overview = {
            sessions: [],
            events: [],
        };
        const getSecurityOverview = { execute: vi.fn().mockResolvedValue(overview) };

        const result = await new GetSecurityOverviewQueryHandler(getSecurityOverview as never)
            .handle(new GetSecurityOverviewQuery(), identity);

        expect(getSecurityOverview.execute).toHaveBeenCalledWith({
            userId: 'user-1',
            currentSessionId: 'session-1',
        });
        expect(result).toEqual(overview);
    });
});
