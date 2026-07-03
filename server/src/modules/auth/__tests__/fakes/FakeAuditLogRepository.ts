import {
    AuditLogRecord,
    AuditLogRepository,
    CreateAuditLogData,
} from '../../domain/AuditLogRepository';

export class FakeAuditLogRepository extends AuditLogRepository {
    readonly logs: AuditLogRecord[] = [];

    async createLog(data: CreateAuditLogData): Promise<void> {
        this.logs.push({
            id: `audit-${this.logs.length + 1}`,
            actorUserId: data.actorUserId ?? null,
            actorSessionId: data.actorSessionId ?? null,
            action: data.action,
            resourceType: data.resourceType,
            resourceId: data.resourceId ?? null,
            metadata: data.metadata ?? null,
            createdAt: new Date(),
        });
    }

    async listRecentAuthLogsForActorUser(actorUserId: string, limit: number): Promise<AuditLogRecord[]> {
        return this.logs
            .filter((log) => log.actorUserId === actorUserId)
            .slice(0, limit);
    }
}
