import type { InboxItem as InboxItemDto } from '@vdp/shared';

import { InboxItem } from '../domain/InboxItem';

export function serializeInboxItem(item: InboxItem): InboxItemDto {
    const snapshot = item.toSnapshot();
    return {
        id: snapshot.id,
        text: snapshot.text,
        note: snapshot.note,
        status: snapshot.status,
        routedTo: snapshot.routedTo,
        triagedAt: snapshot.triagedAt?.toISOString() ?? null,
        suggestedDestination: snapshot.suggestedDestination,
        suggestedAt: snapshot.suggestedAt?.toISOString() ?? null,
        createdAt: snapshot.createdAt.toISOString(),
        updatedAt: snapshot.updatedAt.toISOString(),
    };
}
