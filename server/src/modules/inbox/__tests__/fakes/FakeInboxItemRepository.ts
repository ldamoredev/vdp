import { randomUUID } from 'crypto';

import { InboxItem, type InboxItemSnapshot } from '../../domain/InboxItem';
import { type CaptureInboxItemData, InboxItemRepository } from '../../domain/InboxItemRepository';

export class FakeInboxItemRepository extends InboxItemRepository {
    private store = new Map<string, InboxItemSnapshot>();
    private owners = new Map<string, string>();
    private sequence = 0;

    async captureItem(userId: string, data: CaptureInboxItemData): Promise<InboxItem> {
        const now = new Date(Date.UTC(2026, 5, 29, 10, 0, this.sequence++));
        const item = InboxItem.fromSnapshot({
            id: randomUUID(),
            ownerUserId: userId,
            text: data.text,
            note: data.note ?? null,
            status: 'pending',
            routedTo: null,
            triagedAt: null,
            suggestedDestination: null,
            suggestedAt: null,
            createdAt: now,
            updatedAt: now,
        });
        this.store.set(item.id, item.toSnapshot());
        this.owners.set(item.id, userId);
        return item;
    }

    async getItem(userId: string, id: string): Promise<InboxItem | null> {
        if (this.owners.get(id) !== userId) return null;
        const snapshot = this.store.get(id);
        return snapshot ? InboxItem.fromSnapshot(snapshot) : null;
    }

    async listItems(userId: string): Promise<InboxItem[]> {
        return Array.from(this.store.entries())
            .filter(([id]) => this.owners.get(id) === userId)
            .map(([, snapshot]) => InboxItem.fromSnapshot(snapshot))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    async save(userId: string, item: InboxItem): Promise<InboxItem> {
        if (this.owners.get(item.id) !== userId) {
            throw new Error('Inbox item not found');
        }
        this.store.set(item.id, item.toSnapshot());
        return item;
    }
}
