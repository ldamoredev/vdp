import { UserRepository, UserRecord } from '../domain/UserRepository';
import { AuditLogRepository } from '../domain/AuditLogRepository';
import { TooManyRequestsHttpError, UnauthorizedHttpError } from '../../common/http/errors';
import { PasswordService } from './PasswordService';
import { SessionService } from './SessionService';
import { AuthenticatedUser } from './AuthenticatedUser';
import { LoginRateLimiter } from './LoginRateLimiter';

type LoginInput = {
    email: string;
    password: string;
    userAgent?: string | null;
    ipAddress?: string | null;
};

export class LoginUser {
    constructor(
        private readonly users: UserRepository,
        private readonly auditLogs: AuditLogRepository,
        private readonly passwordService: PasswordService,
        private readonly sessionService: SessionService,
        private readonly rateLimiter: LoginRateLimiter,
    ) {}

    async execute(input: LoginInput): Promise<{ sessionToken: string; user: AuthenticatedUser }> {
        const email = input.email.toLowerCase();

        if (this.rateLimiter.isLimited(email)) {
            throw new TooManyRequestsHttpError('Too many failed login attempts. Try again later.');
        }

        const user = await this.users.findByEmail(email);
        if (!user || !user.isActive) {
            await this.recordFailure(email, null, input);
            throw new UnauthorizedHttpError('Invalid credentials');
        }

        const isValid = await this.passwordService.verify(input.password, user.passwordHash);
        if (!isValid) {
            await this.recordFailure(email, user.id, input);
            throw new UnauthorizedHttpError('Invalid credentials');
        }

        this.rateLimiter.reset(email);

        await this.users.updateLastLoginAt(user.id, new Date());
        const session = await this.sessionService.create(user.id, input.userAgent, input.ipAddress);

        await this.auditLogs.createLog({
            actorUserId: user.id,
            actorSessionId: session.id,
            action: 'auth.login',
            resourceType: 'session',
            resourceId: session.id,
        });

        return { sessionToken: session.token, user: this.toAuthenticatedUser(user) };
    }

    private async recordFailure(email: string, userId: string | null, input: LoginInput): Promise<void> {
        const failureCount = this.rateLimiter.recordFailure(email);
        // One audit row per failed attempt plus an explicit row when the
        // lockout starts, so a brute-force episode is visible at a glance.
        // Never log the password.
        await this.auditLogs.createLog({
            actorUserId: userId,
            action: 'auth.login.failed',
            resourceType: 'auth',
            metadata: {
                email,
                ipAddress: input.ipAddress ?? null,
                userAgent: input.userAgent ?? null,
                failureCount,
            },
        });

        if (failureCount === this.rateLimiter.limit) {
            await this.auditLogs.createLog({
                actorUserId: userId,
                action: 'auth.login.rate_limited',
                resourceType: 'auth',
                metadata: { email, ipAddress: input.ipAddress ?? null },
            });
        }
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
