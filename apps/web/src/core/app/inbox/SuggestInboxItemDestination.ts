import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { InboxItem } from "../../domain/inbox/InboxItem";
import type { InboxGateway } from "../../domain/inbox/InboxGateway";

export class SuggestInboxItemDestination extends Command<InboxItem> {
  constructor(readonly id: string) {
    super();
  }
}

export class SuggestInboxItemDestinationHandler implements RequestHandler<SuggestInboxItemDestination, InboxItem> {
  constructor(private readonly gateway: InboxGateway) {}

  async handle(command: SuggestInboxItemDestination): Promise<InboxItem> {
    return this.gateway.suggestDestination(command.id);
  }
}
