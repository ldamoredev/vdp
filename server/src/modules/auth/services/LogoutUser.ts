import { AuditLogRepository } from '../domain/AuditLogRepository';
import { SessionService } from './SessionService';

export class LogoutUser {
    constructor(
        private readonly auditLogs: AuditLogRepository,
        private readonly sessionService: SessionService,
    ) {}

    async execute(sessionToken: string): Promise<void> {
        const session = await this.sessionService.findByToken(sessionToken);
        if (!session) return;

        await this.sessionService.revoke(session.id);
        await this.auditLogs.createLog({
            actorUserId: session.userId,
            actorSessionId: session.id,
            action: 'auth.logout',
            resourceType: 'session',
            resourceId: session.id,
        });
    }
}
