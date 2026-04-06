import { UnauthorizedHttpError } from '../../common/http/errors';
import { AuditLogRepository } from '../domain/AuditLogRepository';
import { SessionService } from './SessionService';

export class LogoutOtherSessions {
    constructor(
        private readonly auditLogs: AuditLogRepository,
        private readonly sessionService: SessionService,
    ) {}

    async execute(input: { userId: string; currentSessionId: string | null }): Promise<{ revokedSessions: number }> {
        if (!input.currentSessionId) {
            throw new UnauthorizedHttpError('Invalid session');
        }

        const activeSessions = await this.sessionService.listActiveForUser(input.userId);
        const revokedSessions = activeSessions.filter((session) => session.id !== input.currentSessionId).length;

        if (revokedSessions > 0) {
            await this.sessionService.revokeOthers(input.userId, input.currentSessionId);
        }

        await this.auditLogs.createLog({
            actorUserId: input.userId,
            actorSessionId: input.currentSessionId,
            action: 'auth.logout_other_sessions',
            resourceType: 'user',
            resourceId: input.userId,
            metadata: { revokedSessions },
        });

        return { revokedSessions };
    }
}
