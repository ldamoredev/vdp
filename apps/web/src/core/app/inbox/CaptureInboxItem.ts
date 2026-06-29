import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { InboxItem } from "../../domain/inbox/InboxItem";
import type { CaptureInboxItemInput, InboxGateway } from "../../domain/inbox/InboxGateway";

export class CaptureInboxItem extends Command<InboxItem> {
  constructor(readonly input: CaptureInboxItemInput) {
    super();
  }
}

export class CaptureInboxItemHandler implements RequestHandler<CaptureInboxItem, InboxItem> {
  constructor(private readonly gateway: InboxGateway) {}

  async handle(command: CaptureInboxItem): Promise<InboxItem> {
    return this.gateway.captureItem(command.input);
  }
}
