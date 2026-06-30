import type { Core, CoreModule } from "../../Core";
import type { InboxGateway } from "../../domain/inbox/InboxGateway";
import { HttpInboxGateway } from "../../infrastructure/http/HttpInboxGateway";
import { CaptureInboxItem, CaptureInboxItemHandler } from "./CaptureInboxItem";
import { DiscardInboxItem, DiscardInboxItemHandler } from "./DiscardInboxItem";
import { ListInboxItems, ListInboxItemsHandler } from "./ListInboxItems";
import { SuggestInboxItemDestination, SuggestInboxItemDestinationHandler } from "./SuggestInboxItemDestination";
import { TriageInboxItem, TriageInboxItemHandler } from "./TriageInboxItem";

export class InboxModule implements CoreModule {
  constructor(private readonly gateway?: InboxGateway) {}

  register(core: Core): void {
    const gateway = this.gateway ?? new HttpInboxGateway(core.httpClient);

    core.bus.registerHandler(ListInboxItems, () => new ListInboxItemsHandler(gateway));
    core.bus.registerHandler(CaptureInboxItem, () => new CaptureInboxItemHandler(gateway));
    core.bus.registerHandler(TriageInboxItem, () => new TriageInboxItemHandler(gateway));
    core.bus.registerHandler(DiscardInboxItem, () => new DiscardInboxItemHandler(gateway));
    core.bus.registerHandler(SuggestInboxItemDestination, () => new SuggestInboxItemDestinationHandler(gateway));
  }
}
