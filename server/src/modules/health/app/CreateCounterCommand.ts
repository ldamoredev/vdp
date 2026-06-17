import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { CounterRepository } from '../domain/CounterRepository';
import { CreateCounter } from '../services/CreateCounter';
import { CounterOverviewRow, GetCountersOverview } from '../services/GetCountersOverview';

export type CreateCounterCommandInput = {
    readonly name: string;
    readonly emoji?: string | null;
    readonly dailyCost?: string | null;
    readonly startedAt?: string;
};

export class CreateCounterCommand extends Command<CounterOverviewRow> {
    constructor(readonly input: CreateCounterCommandInput) {
        super();
    }
}

export class CreateCounterCommandHandler implements RequestHandler<CreateCounterCommand, CounterOverviewRow> {
    constructor(
        private readonly counters: CounterRepository,
        private readonly eventBus: EventBus,
    ) {}

    async handle(command: CreateCounterCommand, identity: Identity): Promise<CounterOverviewRow> {
        const { userId } = requireUserIdentity(identity);
        const counter = await new CreateCounter(this.counters).execute(userId, command.input);
        return new GetCountersOverview(this.counters, this.eventBus).buildRow(userId, counter);
    }
}
