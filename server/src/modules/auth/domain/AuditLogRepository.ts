export type CreateAuditLogData = {
    actorUserId?: string | null;
    actorSessionId?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    metadata?: unknown;
};

export type AuditLogRecord = {
    id: string;
    actorUserId: string | null;
    actorSessionId: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    metadata: unknown;
    createdAt: Date;
};

export abstract class AuditLogRepository {
    abstract createLog(data: CreateAuditLogData): Promise<void>;
    abstract listRecentAuthLogsForActorUser(actorUserId: string, limit: number): Promise<AuditLogRecord[]>;
}
