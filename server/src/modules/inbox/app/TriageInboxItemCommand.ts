import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { InboxItem } from '../domain/InboxItem';
import { InboxItemRepository } from '../domain/InboxItemRepository';

export class TriageInboxItemCommand extends Command<InboxItem | null> {
    constructor(
        readonly id: string,
        readonly routedTo: string,
    ) {
        super();
    }
}

export class TriageInboxItemCommandHandler implements RequestHandler<TriageInboxItemCommand, InboxItem | null> {
    constructor(private readonly items: InboxItemRepository) {}

    async handle(command: TriageInboxItemCommand, identity: Identity): Promise<InboxItem | null> {
        const { userId } = requireUserIdentity(identity);
        const item = await this.items.getItem(userId, command.id);
        if (!item) return null;
        item.triage(command.routedTo);
        return this.items.save(userId, item);
    }
}
