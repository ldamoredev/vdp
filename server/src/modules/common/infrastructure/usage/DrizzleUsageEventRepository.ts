import { sql } from 'drizzle-orm';

import { Database } from '../../base/db/Database';
import { UsageEvent, UsageEventRepository } from '../../base/usage/UsageEventRepository';
import { usageEvents } from './schema';

export class DrizzleUsageEventRepository extends UsageEventRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async record(event: UsageEvent): Promise<void> {
        await this.db.query
            .insert(usageEvents)
            .values({
                ownerUserId: event.ownerUserId,
                surface: event.surface,
                action: event.action,
                occurredOn: event.occurredOn,
            })
            .onConflictDoUpdate({
                target: [usageEvents.ownerUserId, usageEvents.surface, usageEvents.action, usageEvents.occurredOn],
                set: { count: sql`${usageEvents.count} + 1` },
            });
    }
}
