import { UserRepository, UserRecord } from '../domain/UserRepository';
import { AuditLogRepository } from '../domain/AuditLogRepository';
import { ConflictHttpError, ForbiddenHttpError } from '../../common/http/errors';
import { PasswordService } from './PasswordService';
import { SessionService } from './SessionService';
import { AuthenticatedUser } from './AuthenticatedUser';

export class RegisterUser {
    constructor(
        private readonly users: UserRepository,
        private readonly auditLogs: AuditLogRepository,
        private readonly passwordService: PasswordService,
        private readonly sessionService: SessionService,
    ) {}

    async execute(input: {
        email: string;
        displayName: string;
        password: string;
    }): Promise<{ sessionToken: string; user: AuthenticatedUser }> {
        const userCount = await this.users.countUsers();
        if (userCount > 0) {
            throw new ForbiddenHttpError('Registration is closed');
        }

        const existing = await this.users.findByEmail(input.email.toLowerCase());
        if (existing) {
            throw new ConflictHttpError('Email already registered');
        }

        const now = new Date();
        const role = 'user';
        const user = await this.users.createUser({
            email: input.email.toLowerCase(),
            displayName: input.displayName,
            passwordHash: await this.passwordService.hash(input.password),
            role,
        });

        await this.users.updateLastLoginAt(user.id, now);
        const session = await this.sessionService.create(user.id, null, null);

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

    private toAuthenticatedUser(user: UserRecord): AuthenticatedUser {
        return {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
        };
    }
}
