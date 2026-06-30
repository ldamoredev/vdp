import type { InboxItem } from "./InboxItem";

export interface CaptureInboxItemInput {
  text: string;
  note?: string | null;
}

export interface InboxGateway {
  listItems(): Promise<InboxItem[]>;
  captureItem(input: CaptureInboxItemInput): Promise<InboxItem>;
  triageItem(id: string, routedTo: string): Promise<InboxItem>;
  discardItem(id: string): Promise<InboxItem>;
  suggestDestination(id: string): Promise<InboxItem>;
}
