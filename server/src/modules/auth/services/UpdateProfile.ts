import { AuditLogRepository } from '../domain/AuditLogRepository';
import { UserRecord, UserRepository } from '../domain/UserRepository';
import { NotFoundHttpError } from '../../common/http/errors';
import { AuthenticatedUser } from './AuthenticatedUser';

export class UpdateProfile {
    constructor(
        private readonly users: UserRepository,
        private readonly auditLogs: AuditLogRepository,
    ) {}

    async execute(input: {
        userId: string;
        sessionId: string | null;
        displayName: string;
    }): Promise<AuthenticatedUser> {
        const user = await this.users.updateProfile(input.userId, {
            displayName: input.displayName,
        });

        if (!user) {
            throw new NotFoundHttpError('User not found');
        }

        await this.auditLogs.createLog({
            actorUserId: user.id,
            actorSessionId: input.sessionId,
            action: 'auth.profile_updated',
            resourceType: 'user',
            resourceId: user.id,
            metadata: { displayName: user.displayName },
        });

        return this.toAuthenticatedUser(user);
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

