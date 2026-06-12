import { diffLocalDateISODays, todayISO } from '../../common/base/time/dates';
import { DomainHttpError } from '../../common/http/errors';
import { Counter } from '../domain/Counter';
import { CounterRepository } from '../domain/CounterRepository';
import { highestMilestoneReached } from './counter-milestones';

export class CreateCounter {
    constructor(private readonly counters: CounterRepository) {}

    async execute(userId: string, data: {
        name: string;
        emoji?: string | null;
        dailyCost?: string | null;
        startedAt?: string;
    }): Promise<Counter> {
        const today = todayISO();
        const startedAt = data.startedAt ?? today;

        if (diffLocalDateISODays(startedAt, today) < 0) {
            throw new DomainHttpError('Counter cannot start in the future');
        }

        // Counters created with a past start date (e.g. quit smoking months
        // ago) must not fire retroactive milestones on the first load.
        const currentDays = diffLocalDateISODays(startedAt, today);

        return this.counters.createCounter(userId, {
            name: data.name,
            emoji: data.emoji ?? null,
            dailyCost: data.dailyCost ?? null,
            startedAt,
            lastMilestoneNotified: highestMilestoneReached(currentDays),
        });
    }
}
