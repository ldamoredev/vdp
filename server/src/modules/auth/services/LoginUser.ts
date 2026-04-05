import { UserRepository, UserRecord } from '../domain/UserRepository';
import { AuditLogRepository } from '../domain/AuditLogRepository';
import { UnauthorizedHttpError } from '../../common/http/errors';
import { PasswordService } from './PasswordService';
import { SessionService } from './SessionService';
import { AuthenticatedUser } from './AuthenticatedUser';

export class LoginUser {
    constructor(
        private readonly users: UserRepository,
        private readonly auditLogs: AuditLogRepository,
        private readonly passwordService: PasswordService,
        private readonly sessionService: SessionService,
    ) {}

    async execute(input: {
        email: string;
        password: string;
        userAgent?: string | null;
        ipAddress?: string | null;
    }): Promise<{ sessionToken: string; user: AuthenticatedUser }> {
        const user = await this.users.findByEmail(input.email.toLowerCase());
        if (!user || !user.isActive) {
            throw new UnauthorizedHttpError('Invalid credentials');
        }

        const isValid = await this.passwordService.verify(input.password, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedHttpError('Invalid credentials');
        }

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

    private toAuthenticatedUser(user: UserRecord): AuthenticatedUser {
        return {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
        };
    }
}
