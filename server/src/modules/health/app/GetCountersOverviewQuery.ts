import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { CounterRepository } from '../domain/CounterRepository';
import { CountersOverview, GetCountersOverview } from '../services/GetCountersOverview';

export class GetCountersOverviewQuery extends Query<CountersOverview> {}

export class GetCountersOverviewQueryHandler implements RequestHandler<GetCountersOverviewQuery, CountersOverview> {
    constructor(
        private readonly counters: CounterRepository,
        private readonly eventBus: EventBus,
    ) {}

    async handle(_query: GetCountersOverviewQuery, identity: Identity): Promise<CountersOverview> {
        const { userId } = requireUserIdentity(identity);
        return new GetCountersOverview(this.counters, this.eventBus).execute(userId);
    }
}
