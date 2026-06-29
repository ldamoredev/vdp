import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { InboxItem } from '../domain/InboxItem';
import { InboxItemRepository } from '../domain/InboxItemRepository';

export class DiscardInboxItemCommand extends Command<InboxItem | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class DiscardInboxItemCommandHandler implements RequestHandler<DiscardInboxItemCommand, InboxItem | null> {
    constructor(private readonly items: InboxItemRepository) {}

    async handle(command: DiscardInboxItemCommand, identity: Identity): Promise<InboxItem | null> {
        const { userId } = requireUserIdentity(identity);
        const item = await this.items.getItem(userId, command.id);
        if (!item) return null;
        item.discard();
        return this.items.save(userId, item);
    }
}
