import { ModuleContext } from '../common/base/modules/ModuleContext';
import { CaptureInboxItemCommand, CaptureInboxItemCommandHandler } from './app/CaptureInboxItemCommand';
import { DiscardInboxItemCommand, DiscardInboxItemCommandHandler } from './app/DiscardInboxItemCommand';
import { GetInboxItemQuery, GetInboxItemQueryHandler } from './app/GetInboxItemQuery';
import { ListInboxItemsQuery, ListInboxItemsQueryHandler } from './app/ListInboxItemsQuery';
import { InboxItemRepository } from './domain/InboxItemRepository';
import { InboxController } from './infrastructure/routes/InboxController';

export class InboxModuleRuntime {
    constructor(private deps: ModuleContext) {}

    registerHandlers(): void {
        this.deps.bus.registerHandler(CaptureInboxItemCommand, () =>
            new CaptureInboxItemCommandHandler(this.inboxItemRepository()),
        );
        this.deps.bus.registerHandler(ListInboxItemsQuery, () =>
            new ListInboxItemsQueryHandler(this.inboxItemRepository()),
        );
        this.deps.bus.registerHandler(GetInboxItemQuery, () =>
            new GetInboxItemQueryHandler(this.inboxItemRepository()),
        );
        this.deps.bus.registerHandler(DiscardInboxItemCommand, () =>
            new DiscardInboxItemCommandHandler(this.inboxItemRepository()),
        );
    }

    createControllers() {
        return [new InboxController(this.deps.bus)];
    }

    private inboxItemRepository(): InboxItemRepository {
        return this.deps.repositories.get(InboxItemRepository);
    }
}
