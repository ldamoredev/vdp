import type { InboxItem as InboxItemDto } from "@vdp/shared";

import { InboxItem } from "../../../../domain/inbox/InboxItem";
import type { CaptureInboxItemInput, InboxGateway } from "../../../../domain/inbox/InboxGateway";

export interface RecordedCall {
  method: string;
  args: unknown[];
}

function dto(overrides: Partial<InboxItemDto> = {}): InboxItemDto {
  return {
    id: "i1",
    text: "Idea suelta",
    note: null,
    status: "pending",
    routedTo: null,
    triagedAt: null,
    suggestedDestination: null,
    suggestedAt: null,
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z",
    ...overrides,
  };
}

export class FakeInboxGateway implements InboxGateway {
  readonly calls: RecordedCall[] = [];
  items: InboxItem[] = [InboxItem.from(dto())];
  /** What suggestDestination() resolves to next, like the LLM classifier would. */
  suggestionToReturn: "tasks" | "wallet" | null = null;
  private sequence = 0;

  private record(method: string, ...args: unknown[]) {
    this.calls.push({ method, args });
  }

  callsTo(method: string): RecordedCall[] {
    return this.calls.filter((call) => call.method === method);
  }

  async listItems(): Promise<InboxItem[]> {
    this.record("listItems");
    return this.items;
  }

  async captureItem(input: CaptureInboxItemInput): Promise<InboxItem> {
    this.record("captureItem", input);
    const item = InboxItem.from(dto({
      id: `created-${this.sequence++}`,
      text: input.text,
      note: input.note ?? null,
    }));
    this.items = [item, ...this.items];
    return item;
  }

  async triageItem(id: string, routedTo: string): Promise<InboxItem> {
    this.record("triageItem", id, routedTo);
    const current = this.items.find((item) => item.id === id) ?? InboxItem.from(dto({ id }));
    const item = InboxItem.from(dto({
      id,
      text: current.text,
      note: current.note,
      status: "triaged",
      routedTo,
    }));
    this.items = this.items.map((candidate) => (candidate.id === id ? item : candidate));
    return item;
  }

  async discardItem(id: string): Promise<InboxItem> {
    this.record("discardItem", id);
    const current = this.items.find((item) => item.id === id) ?? InboxItem.from(dto({ id }));
    const item = InboxItem.from(dto({
      id,
      text: current.text,
      note: current.note,
      status: "discarded",
    }));
    this.items = this.items.map((candidate) => (candidate.id === id ? item : candidate));
    return item;
  }

  async suggestDestination(id: string): Promise<InboxItem> {
    this.record("suggestDestination", id);
    const current = this.items.find((item) => item.id === id) ?? InboxItem.from(dto({ id }));
    const item = InboxItem.from(dto({
      id,
      text: current.text,
      note: current.note,
      status: current.status,
      routedTo: current.routedTo,
      triagedAt: current.triagedAt,
      suggestedDestination: this.suggestionToReturn,
      suggestedAt: "2026-06-30T10:00:00.000Z",
    }));
    this.items = this.items.map((candidate) => (candidate.id === id ? item : candidate));
    return item;
  }
}
