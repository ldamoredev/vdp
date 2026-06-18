import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { diffLocalDateISODays, todayISO } from '../../common/base/time/dates';
import { DomainHttpError } from '../../common/http/errors';
import { CounterRepository } from '../domain/CounterRepository';
import { highestMilestoneReached } from './counter-milestones';
import { CounterOverviewRow, GetCountersOverviewQueryHandler } from './GetCountersOverviewQuery';

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
        const today = todayISO();
        const startedAt = command.input.startedAt ?? today;

        if (diffLocalDateISODays(startedAt, today) < 0) {
            throw new DomainHttpError('Counter cannot start in the future');
        }

        const currentDays = diffLocalDateISODays(startedAt, today);
        const counter = await this.counters.createCounter(userId, {
            name: command.input.name,
            emoji: command.input.emoji ?? null,
            dailyCost: command.input.dailyCost ?? null,
            startedAt,
            lastMilestoneNotified: highestMilestoneReached(currentDays),
        });

        return new GetCountersOverviewQueryHandler(this.counters, this.eventBus).buildRow(userId, counter);
    }
}
