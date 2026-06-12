import { diffLocalDateISODays, todayISO } from '../../common/base/time/dates';
import { DomainHttpError, NotFoundHttpError } from '../../common/http/errors';
import { Counter } from '../domain/Counter';
import { CounterRepository } from '../domain/CounterRepository';

export class RelapseCounter {
    constructor(private readonly counters: CounterRepository) {}

    async execute(userId: string, counterId: string, date?: string): Promise<Counter> {
        const today = todayISO();
        const relapseDate = date ?? today;

        const counter = await this.counters.getCounter(userId, counterId);
        if (!counter) throw new NotFoundHttpError('Counter not found');
        if (counter.isArchived()) throw new DomainHttpError('Counter is archived');

        if (diffLocalDateISODays(relapseDate, today) < 0) {
            throw new DomainHttpError('Relapse cannot be in the future');
        }
        if (diffLocalDateISODays(counter.startedAt, relapseDate) < 0) {
            throw new DomainHttpError('Relapse cannot precede the current attempt start');
        }

        await this.counters.addAttempt(userId, counterId, {
            startedAt: counter.startedAt,
            endedAt: relapseDate,
            days: diffLocalDateISODays(counter.startedAt, relapseDate),
        });

        counter.relapse(relapseDate);
        return this.counters.save(userId, counter);
    }
}
