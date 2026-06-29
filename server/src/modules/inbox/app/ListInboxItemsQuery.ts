import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { InboxItem } from '../domain/InboxItem';
import { InboxItemRepository } from '../domain/InboxItemRepository';

export class ListInboxItemsQuery extends Query<InboxItem[]> {}

export class ListInboxItemsQueryHandler implements RequestHandler<ListInboxItemsQuery, InboxItem[]> {
    constructor(private readonly items: InboxItemRepository) {}

    async handle(_query: ListInboxItemsQuery, identity: Identity): Promise<InboxItem[]> {
        const { userId } = requireUserIdentity(identity);
        return this.items.listItems(userId);
    }
}
