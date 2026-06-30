export type InboxItemStatus = "pending" | "triaged" | "discarded";

export interface InboxItem {
  id: string;
  text: string;
  note: string | null;
  status: InboxItemStatus;
  routedTo: string | null;
  triagedAt: string | null;
  suggestedDestination: string | null;
  suggestedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
