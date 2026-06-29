import { InboxItem } from './InboxItem';

export type CaptureInboxItemData = {
    readonly text: string;
    readonly note?: string | null;
};

export abstract class InboxItemRepository {
    abstract captureItem(userId: string, data: CaptureInboxItemData): Promise<InboxItem>;
    abstract getItem(userId: string, id: string): Promise<InboxItem | null>;
    abstract listItems(userId: string): Promise<InboxItem[]>;
    abstract save(userId: string, item: InboxItem): Promise<InboxItem>;
}
