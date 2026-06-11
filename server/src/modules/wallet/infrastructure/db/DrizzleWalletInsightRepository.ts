import { and, asc, eq, sql } from 'drizzle-orm';
import { Database } from '../../../common/base/db/Database';
import { PersistedWalletInsight, WalletInsightRepository } from '../../domain/WalletInsightRepository';
import { walletInsights } from './schema';

export class DrizzleWalletInsightRepository extends WalletInsightRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async insert(insight: PersistedWalletInsight): Promise<void> {
        await this.db.query.insert(walletInsights).values({
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
            .update(walletInsights)
            .set({ read: true })
            .where(and(eq(walletInsights.id, insightId), eq(walletInsights.ownerUserId, userId)));
    }

    async listAll(): Promise<PersistedWalletInsight[]> {
        const rows = await this.db.query
            .select()
            .from(walletInsights)
            .orderBy(asc(walletInsights.createdAt), asc(walletInsights.id));

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
        await this.db.query.delete(walletInsights).where(and(
            eq(walletInsights.ownerUserId, userId),
            sql`${walletInsights.id} NOT IN (
                SELECT ${walletInsights.id} FROM ${walletInsights}
                WHERE ${walletInsights.ownerUserId} = ${userId}
                ORDER BY ${walletInsights.createdAt} DESC, ${walletInsights.id} DESC
                LIMIT ${keep}
            )`,
        ));
    }
}
