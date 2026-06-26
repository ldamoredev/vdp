import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TimeEntry } from '../domain/TimeEntry';
import { TimeEntryFilters, TimeEntryRepository } from '../domain/TimeEntryRepository';

export class ListTimeEntriesQuery extends Query<TimeEntry[]> {
    constructor(readonly filters: TimeEntryFilters = {}) {
        super();
    }
}

export class ListTimeEntriesQueryHandler implements RequestHandler<ListTimeEntriesQuery, TimeEntry[]> {
    constructor(private readonly entries: TimeEntryRepository) {}

    async handle(query: ListTimeEntriesQuery, identity: Identity): Promise<TimeEntry[]> {
        const { userId } = requireUserIdentity(identity);
        return this.entries.listTimeEntries(userId, query.filters);
    }
}
