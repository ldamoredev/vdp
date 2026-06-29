import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { InboxItem } from "../../domain/inbox/InboxItem";
import type { InboxGateway } from "../../domain/inbox/InboxGateway";

export class ListInboxItems extends Query<InboxItem[]> {}

export class ListInboxItemsHandler implements RequestHandler<ListInboxItems, InboxItem[]> {
  constructor(private readonly gateway: InboxGateway) {}

  async handle(): Promise<InboxItem[]> {
    return this.gateway.listItems();
  }
}
