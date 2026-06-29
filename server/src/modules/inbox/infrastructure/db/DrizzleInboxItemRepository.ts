import { and, desc, eq } from 'drizzle-orm';

import { Database } from '../../../common/base/db/Database';
import { InboxItem } from '../../domain/InboxItem';
import { CaptureInboxItemData, InboxItemRepository } from '../../domain/InboxItemRepository';
import { inboxItems } from './schema';

export class DrizzleInboxItemRepository extends InboxItemRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async captureItem(userId: string, data: CaptureInboxItemData): Promise<InboxItem> {
        const [row] = await this.db.query
            .insert(inboxItems)
            .values({
                ownerUserId: userId,
                text: data.text,
                note: data.note ?? null,
            })
            .returning();

        return this.toItem(row);
    }

    async getItem(userId: string, id: string): Promise<InboxItem | null> {
        const [row] = await this.db.query
            .select()
            .from(inboxItems)
            .where(and(eq(inboxItems.id, id), eq(inboxItems.ownerUserId, userId)))
            .limit(1);

        return row ? this.toItem(row) : null;
    }

    async listItems(userId: string): Promise<InboxItem[]> {
        const rows = await this.db.query
            .select()
            .from(inboxItems)
            .where(eq(inboxItems.ownerUserId, userId))
            .orderBy(desc(inboxItems.createdAt));

        return rows.map((row) => this.toItem(row));
    }

    async save(userId: string, item: InboxItem): Promise<InboxItem> {
        const snapshot = item.toSnapshot();
        const [row] = await this.db.query
            .update(inboxItems)
            .set({
                text: snapshot.text,
                note: snapshot.note,
                status: snapshot.status,
                routedTo: snapshot.routedTo,
                triagedAt: snapshot.triagedAt,
                updatedAt: snapshot.updatedAt,
            })
            .where(and(eq(inboxItems.id, snapshot.id), eq(inboxItems.ownerUserId, userId)))
            .returning();

        return this.toItem(row);
    }

    private toItem(row: typeof inboxItems.$inferSelect): InboxItem {
        return InboxItem.fromSnapshot({
            id: row.id,
            ownerUserId: row.ownerUserId,
            text: row.text,
            note: row.note,
            status: row.status,
            routedTo: row.routedTo,
            triagedAt: row.triagedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}
