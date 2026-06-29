import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { InboxItem } from "../../domain/inbox/InboxItem";
import type { InboxGateway } from "../../domain/inbox/InboxGateway";

export class TriageInboxItem extends Command<InboxItem> {
  constructor(
    readonly id: string,
    readonly routedTo: string,
  ) {
    super();
  }
}

export class TriageInboxItemHandler implements RequestHandler<TriageInboxItem, InboxItem> {
  constructor(private readonly gateway: InboxGateway) {}

  async handle(command: TriageInboxItem): Promise<InboxItem> {
    return this.gateway.triageItem(command.id, command.routedTo);
  }
}
