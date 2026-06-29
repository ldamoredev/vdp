import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { InboxItem } from "../../domain/inbox/InboxItem";
import type { InboxGateway } from "../../domain/inbox/InboxGateway";

export class DiscardInboxItem extends Command<InboxItem> {
  constructor(readonly id: string) {
    super();
  }
}

export class DiscardInboxItemHandler implements RequestHandler<DiscardInboxItem, InboxItem> {
  constructor(private readonly gateway: InboxGateway) {}

  async handle(command: DiscardInboxItem): Promise<InboxItem> {
    return this.gateway.discardItem(command.id);
  }
}
