import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { AgentProvider } from '../../common/base/agents/providers/AgentProvider';
import { InboxItem } from '../domain/InboxItem';
import { InboxItemRepository } from '../domain/InboxItemRepository';
import { classifyInboxDestination } from '../services/classify-destination';

export class SuggestInboxItemDestinationCommand extends Command<InboxItem | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class SuggestInboxItemDestinationCommandHandler
    implements RequestHandler<SuggestInboxItemDestinationCommand, InboxItem | null>
{
    constructor(
        private readonly items: InboxItemRepository,
        private readonly provider: AgentProvider,
    ) {}

    async handle(command: SuggestInboxItemDestinationCommand, identity: Identity): Promise<InboxItem | null> {
        const { userId } = requireUserIdentity(identity);
        const item = await this.items.getItem(userId, command.id);
        if (!item) return null;
        if (item.suggestedAt !== null || item.status !== 'pending') return item;

        const destination = await classifyInboxDestination(this.provider, item.text);
        item.suggestDestination(destination);
        return this.items.save(userId, item);
    }
}
