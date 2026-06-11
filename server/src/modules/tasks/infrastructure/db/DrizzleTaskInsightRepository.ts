import { and, asc, eq, sql } from 'drizzle-orm';
import { Database } from '../../../common/base/db/Database';
import { PersistedTaskInsight, TaskInsightRepository } from '../../domain/TaskInsightRepository';
import { taskInsights } from './schema';

export class DrizzleTaskInsightRepository extends TaskInsightRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async insert(insight: PersistedTaskInsight): Promise<void> {
        await this.db.query.insert(taskInsights).values({
            id: insight.id,
            ownerUserId: insight.userId,
            type: insight.type,
            title: insight.title,
            message: insight.message,
            metadata: insight.metadata ?? null,
            read: insight.read,
            createdAt: insight.createdAt,
        });
    }

    async markRead(userId: string, insightId: string): Promise<void> {
        await this.db.query
            .update(taskInsights)
            .set({ read: true })
            .where(and(eq(taskInsights.id, insightId), eq(taskInsights.ownerUserId, userId)));
    }

    async markAllRead(userId: string): Promise<void> {
        await this.db.query
            .update(taskInsights)
            .set({ read: true })
            .where(eq(taskInsights.ownerUserId, userId));
    }

    async listAll(): Promise<PersistedTaskInsight[]> {
        const rows = await this.db.query
            .select()
            .from(taskInsights)
            .orderBy(asc(taskInsights.createdAt), asc(taskInsights.id));

        return rows.map((row) => ({
            id: row.id,
            userId: row.ownerUserId,
            type: row.type,
            title: row.title,
            message: row.message,
            metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
            read: row.read,
            createdAt: row.createdAt,
        }));
    }

    async trimToNewest(userId: string, keep: number): Promise<void> {
        await this.db.query.delete(taskInsights).where(and(
            eq(taskInsights.ownerUserId, userId),
            sql`${taskInsights.id} NOT IN (
                SELECT ${taskInsights.id} FROM ${taskInsights}
                WHERE ${taskInsights.ownerUserId} = ${userId}
                ORDER BY ${taskInsights.createdAt} DESC, ${taskInsights.id} DESC
                LIMIT ${keep}
            )`,
        ));
    }
}
