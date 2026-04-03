export type CreateAuditLogData = {
    actorUserId?: string | null;
    actorSessionId?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    metadata?: unknown;
};

export abstract class AuditLogRepository {
    abstract createLog(data: CreateAuditLogData): Promise<void>;
}
