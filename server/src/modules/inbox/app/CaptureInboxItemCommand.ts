import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { InboxItem } from '../domain/InboxItem';
import { CaptureInboxItemData, InboxItemRepository } from '../domain/InboxItemRepository';

export class CaptureInboxItemCommand extends Command<InboxItem> {
    constructor(readonly input: CaptureInboxItemData) {
        super();
    }
}

export class CaptureInboxItemCommandHandler implements RequestHandler<CaptureInboxItemCommand, InboxItem> {
    constructor(private readonly items: InboxItemRepository) {}

    async handle(command: CaptureInboxItemCommand, identity: Identity): Promise<InboxItem> {
        const { userId } = requireUserIdentity(identity);
        return this.items.captureItem(userId, command.input);
    }
}
