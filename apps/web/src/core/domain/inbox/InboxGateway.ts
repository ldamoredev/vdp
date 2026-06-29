import type { InboxItem } from "./InboxItem";

export interface CaptureInboxItemInput {
  text: string;
  note?: string | null;
}

export interface InboxGateway {
  listItems(): Promise<InboxItem[]>;
  captureItem(input: CaptureInboxItemInput): Promise<InboxItem>;
  discardItem(id: string): Promise<InboxItem>;
}
