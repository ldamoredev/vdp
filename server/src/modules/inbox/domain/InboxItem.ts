export type InboxItemStatus = 'pending' | 'triaged' | 'discarded';

type InboxItemSnapshotLike = Omit<InboxItemSnapshot, 'status'> & {
    status: string;
};

export class InboxItem {
    private constructor(
        public readonly id: string,
        public readonly ownerUserId: string,
        public text: string,
        public note: string | null,
        public status: InboxItemStatus,
        public routedTo: string | null,
        public triagedAt: Date | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) {}

    discard(): void {
        if (this.status === 'discarded') return;
        this.status = 'discarded';
        this.updatedAt = new Date();
    }

    triage(routedTo: string): void {
        const normalized = routedTo.trim();
        if (!normalized) throw new Error('Inbox item triage target is required');
        this.status = 'triaged';
        this.routedTo = normalized;
        this.triagedAt = new Date();
        this.updatedAt = new Date();
    }

    isPending(): boolean {
        return this.status === 'pending';
    }

    toSnapshot(): InboxItemSnapshot {
        return {
            id: this.id,
            ownerUserId: this.ownerUserId,
            text: this.text,
            note: this.note,
            status: this.status,
            routedTo: this.routedTo,
            triagedAt: this.triagedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    static fromSnapshot(s: InboxItemSnapshotLike): InboxItem {
        return new InboxItem(
            s.id,
            s.ownerUserId,
            InboxItem.assertNonEmptyText(s.text),
            s.note,
            InboxItem.parseStatus(s.status),
            s.routedTo,
            s.triagedAt,
            s.createdAt,
            s.updatedAt,
        );
    }

    private static assertNonEmptyText(text: string): string {
        const normalized = text.trim();
        if (!normalized) throw new Error('Inbox item text is required');
        return normalized;
    }

    private static parseStatus(status: string): InboxItemStatus {
        switch (status) {
            case 'pending':
            case 'triaged':
            case 'discarded':
                return status;
            default:
                throw new Error(`Invalid inbox item status: ${status}`);
        }
    }
}

export type InboxItemSnapshot = {
    id: string;
    ownerUserId: string;
    text: string;
    note: string | null;
    status: InboxItemStatus;
    routedTo: string | null;
    triagedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};
