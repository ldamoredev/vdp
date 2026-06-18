import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { diffLocalDateISODays, todayISO } from '../../common/base/time/dates';
import { DomainHttpError, NotFoundHttpError } from '../../common/http/errors';
import { CounterRepository } from '../domain/CounterRepository';
import { CounterOverviewRow, GetCountersOverviewQueryHandler } from './GetCountersOverviewQuery';

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
        const today = todayISO();
        const relapseDate = command.date ?? today;

        const counter = await this.counters.getCounter(userId, command.counterId);
        if (!counter) throw new NotFoundHttpError('Counter not found');
        if (counter.isArchived()) throw new DomainHttpError('Counter is archived');

        if (diffLocalDateISODays(relapseDate, today) < 0) {
            throw new DomainHttpError('Relapse cannot be in the future');
        }
        if (diffLocalDateISODays(counter.startedAt, relapseDate) < 0) {
            throw new DomainHttpError('Relapse cannot precede the current attempt start');
        }

        await this.counters.addAttempt(userId, command.counterId, {
            startedAt: counter.startedAt,
            endedAt: relapseDate,
            days: diffLocalDateISODays(counter.startedAt, relapseDate),
        });

        counter.relapse(relapseDate);
        const saved = await this.counters.save(userId, counter);
        return new GetCountersOverviewQueryHandler(this.counters, this.eventBus).buildRow(userId, saved);
    }
}
