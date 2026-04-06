import { AuditLogRepository } from '../domain/AuditLogRepository';
import { SessionService } from './SessionService';

export type SecuritySessionView = {
    id: string;
    userAgent: string | null;
    ipAddress: string | null;
    lastSeenAt: string;
    createdAt: string;
    expiresAt: string;
    isCurrent: boolean;
};

export type SecurityEventView = {
    id: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    actorSessionId: string | null;
    createdAt: string;
    metadata: unknown;
};

export class GetSecurityOverview {
    constructor(
        private readonly sessionService: SessionService,
        private readonly auditLogs: AuditLogRepository,
    ) {}

    async execute(input: { userId: string; currentSessionId: string | null }): Promise<{
        sessions: SecuritySessionView[];
        events: SecurityEventView[];
    }> {
        const [sessions, events] = await Promise.all([
            this.sessionService.listActiveForUser(input.userId),
            this.auditLogs.listRecentAuthLogsForActorUser(input.userId, 8),
        ]);

        return {
            sessions: sessions.map((session) => ({
                id: session.id,
                userAgent: session.userAgent,
                ipAddress: session.ipAddress,
                lastSeenAt: session.lastSeenAt.toISOString(),
                createdAt: session.createdAt.toISOString(),
                expiresAt: session.expiresAt.toISOString(),
                isCurrent: session.id === input.currentSessionId,
            })),
            events: events.map((event) => ({
                id: event.id,
                action: event.action,
                resourceType: event.resourceType,
                resourceId: event.resourceId,
                actorSessionId: event.actorSessionId,
                createdAt: event.createdAt.toISOString(),
                metadata: event.metadata ?? null,
            })),
        };
    }
}
