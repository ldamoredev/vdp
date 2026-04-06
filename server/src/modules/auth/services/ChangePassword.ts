import { AuditLogRepository } from '../domain/AuditLogRepository';
import { UserRepository } from '../domain/UserRepository';
import { ConflictHttpError, UnauthorizedHttpError } from '../../common/http/errors';
import { PasswordService } from './PasswordService';
import { SessionService } from './SessionService';

export class ChangePassword {
    constructor(
        private readonly users: UserRepository,
        private readonly auditLogs: AuditLogRepository,
        private readonly passwordService: PasswordService,
        private readonly sessionService: SessionService,
    ) {}

    async execute(input: {
        userId: string;
        sessionId: string | null;
        currentPassword: string;
        newPassword: string;
    }): Promise<void> {
        const user = await this.users.findById(input.userId);
        if (!user || !user.isActive) {
            throw new UnauthorizedHttpError('Invalid credentials');
        }

        const currentPasswordMatches = await this.passwordService.verify(
            input.currentPassword,
            user.passwordHash,
        );
        if (!currentPasswordMatches) {
            throw new UnauthorizedHttpError('Invalid credentials');
        }

        const sameAsCurrent = await this.passwordService.verify(
            input.newPassword,
            user.passwordHash,
        );
        if (sameAsCurrent) {
            throw new ConflictHttpError('New password must be different');
        }

        await this.users.updatePasswordHash(
            user.id,
            await this.passwordService.hash(input.newPassword),
        );
        await this.sessionService.revokeAllForUser(user.id);
        await this.auditLogs.createLog({
            actorUserId: user.id,
            actorSessionId: input.sessionId,
            action: 'auth.password_changed',
            resourceType: 'user',
            resourceId: user.id,
        });
    }
}

