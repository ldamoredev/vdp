import { Database } from '../../../common/base/db/Database';
import { AuditLogRepository, CreateAuditLogData } from '../../domain/AuditLogRepository';
import { auditLogs } from '../schema';

export class DrizzleAuditLogRepository extends AuditLogRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async createLog(data: CreateAuditLogData): Promise<void> {
        await this.db.query.insert(auditLogs).values({
            actorUserId: data.actorUserId ?? null,
            actorSessionId: data.actorSessionId ?? null,
            action: data.action,
            resourceType: data.resourceType,
            resourceId: data.resourceId ?? null,
            metadata: data.metadata ?? null,
        });
    }
}
