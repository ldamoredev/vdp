import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { InboxItem } from '../domain/InboxItem';
import { InboxItemRepository } from '../domain/InboxItemRepository';

export class GetInboxItemQuery extends Query<InboxItem | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class GetInboxItemQueryHandler implements RequestHandler<GetInboxItemQuery, InboxItem | null> {
    constructor(private readonly items: InboxItemRepository) {}

    async handle(query: GetInboxItemQuery, identity: Identity): Promise<InboxItem | null> {
        const { userId } = requireUserIdentity(identity);
        return this.items.getItem(userId, query.id);
    }
}
