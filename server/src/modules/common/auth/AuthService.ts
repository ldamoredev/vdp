import { AuditLogRepository } from '../base/auth/AuditLogRepository';
import { SessionRepository } from '../base/auth/SessionRepository';
import { UserRecord, UserRepository } from '../base/auth/UserRepository';
import { ConflictHttpError, UnauthorizedHttpError } from '../http/errors';
import { generateSessionToken, hashSessionToken } from './sessions';
import { hashPassword, verifyPassword } from './passwords';

export type AuthenticatedUser = {
    id: string;
    email: string;
    displayName: string;
    role: 'user';
};

export class AuthService {
    constructor(
        private readonly users: UserRepository,
        private readonly sessions: SessionRepository,
        private readonly auditLogs: AuditLogRepository,
    ) {}

    async getSetupStatus(): Promise<{ hasUsers: boolean }> {
        return { hasUsers: (await this.users.countUsers()) > 0 };
    }

    async register(input: {
        email: string;
        displayName: string;
        password: string;
    }): Promise<{ sessionToken: string; user: AuthenticatedUser }> {
        const existing = await this.users.findByEmail(input.email.toLowerCase());
        if (existing) {
            throw new ConflictHttpError('Email already registered');
        }

        const now = new Date();
        const role = 'user';
        const user = await this.users.createUser({
            email: input.email.toLowerCase(),
            displayName: input.displayName,
            passwordHash: await hashPassword(input.password),
            role,
        });

        await this.users.updateLastLoginAt(user.id, now);
        const session = await this.createSession(user.id, null, null);

        await this.auditLogs.createLog({
            actorUserId: user.id,
            actorSessionId: session.id,
            action: 'auth.user_registered',
            resourceType: 'user',
            resourceId: user.id,
            metadata: { email: user.email, role },
        });

        return { sessionToken: session.token, user: this.toAuthenticatedUser(user) };
    }

    async login(input: {
        email: string;
        password: string;
        userAgent?: string | null;
        ipAddress?: string | null;
    }): Promise<{ sessionToken: string; user: AuthenticatedUser }> {
        const user = await this.users.findByEmail(input.email.toLowerCase());
        if (!user || !user.isActive) {
            throw new UnauthorizedHttpError('Invalid credentials');
        }

        const isValid = await verifyPassword(input.password, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedHttpError('Invalid credentials');
        }

        await this.users.updateLastLoginAt(user.id, new Date());
        const session = await this.createSession(user.id, input.userAgent, input.ipAddress);

        await this.auditLogs.createLog({
            actorUserId: user.id,
            actorSessionId: session.id,
            action: 'auth.login',
            resourceType: 'session',
            resourceId: session.id,
        });

        return { sessionToken: session.token, user: this.toAuthenticatedUser(user) };
    }

    async getAuthenticatedUser(sessionToken: string): Promise<{ user: AuthenticatedUser; sessionId: string }> {
        const session = await this.sessions.findByTokenHash(hashSessionToken(sessionToken));
        if (!session || session.expiresAt <= new Date()) {
            throw new UnauthorizedHttpError('Session expired or invalid');
        }

        const user = await this.users.findById(session.userId);
        if (!user || !user.isActive) {
            throw new UnauthorizedHttpError('Session expired or invalid');
        }

        await this.sessions.touchSession(session.id, new Date());

        return {
            user: this.toAuthenticatedUser(user),
            sessionId: session.id,
        };
    }

    async logout(sessionToken: string): Promise<void> {
        const session = await this.sessions.findByTokenHash(hashSessionToken(sessionToken));
        if (!session) return;

        await this.sessions.revokeSession(session.id, new Date());
        await this.auditLogs.createLog({
            actorUserId: session.userId,
            actorSessionId: session.id,
            action: 'auth.logout',
            resourceType: 'session',
            resourceId: session.id,
        });
    }

    private async createSession(
        userId: string,
        userAgent?: string | null,
        ipAddress?: string | null,
    ): Promise<{ id: string; token: string }> {
        const token = generateSessionToken();
        const session = await this.sessions.createSession({
            userId,
            tokenHash: hashSessionToken(token),
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            userAgent,
            ipAddress,
        });
        return { id: session.id, token };
    }

    private toAuthenticatedUser(user: UserRecord): AuthenticatedUser {
        return {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
        };
    }
}
