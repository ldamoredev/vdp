import type { InboxItem as InboxItemDto, InboxItemStatus } from "@vdp/shared";

export class InboxItem {
  private constructor(
    readonly id: string,
    readonly text: string,
    readonly note: string | null,
    readonly status: InboxItemStatus,
    readonly routedTo: string | null,
    readonly triagedAt: string | null,
    readonly suggestedDestination: string | null,
    readonly suggestedAt: string | null,
    readonly createdAt: string,
    readonly updatedAt: string,
  ) {}

  static from(dto: InboxItemDto): InboxItem {
    return new InboxItem(
      dto.id,
      dto.text,
      dto.note,
      dto.status,
      dto.routedTo,
      dto.triagedAt,
      dto.suggestedDestination,
      dto.suggestedAt,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  get isPending(): boolean {
    return this.status === "pending";
  }
}

export function pendingInboxItems(items: readonly InboxItem[]): InboxItem[] {
  return items.filter((item) => item.isPending);
}
