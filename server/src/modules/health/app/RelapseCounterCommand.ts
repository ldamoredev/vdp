import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { CounterRepository } from '../domain/CounterRepository';
import { GetCountersOverview, CounterOverviewRow } from '../services/GetCountersOverview';
import { RelapseCounter } from '../services/RelapseCounter';

export class RelapseCounterCommand extends Command<CounterOverviewRow> {
    constructor(
        readonly counterId: string,
        readonly date?: string,
    ) {
        super();
    }
}

export class RelapseCounterCommandHandler implements RequestHandler<RelapseCounterCommand, CounterOverviewRow> {
    constructor(
        private readonly counters: CounterRepository,
        private readonly eventBus: EventBus,
    ) {}

    async handle(command: RelapseCounterCommand, identity: Identity): Promise<CounterOverviewRow> {
        const { userId } = requireUserIdentity(identity);
        const counter = await new RelapseCounter(this.counters).execute(userId, command.counterId, command.date);
        return new GetCountersOverview(this.counters, this.eventBus).buildRow(userId, counter);
    }
}
