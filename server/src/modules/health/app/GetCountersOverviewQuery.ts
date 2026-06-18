import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { diffLocalDateISODays, todayISO } from '../../common/base/time/dates';
import { Counter } from '../domain/Counter';
import { CounterRepository } from '../domain/CounterRepository';
import { CounterMilestone } from '../domain/events/CounterMilestone';
import { moneyNotSpent, pendingMilestone } from './counter-milestones';

export type CounterOverviewRow = {
    readonly id: string;
    readonly name: string;
    readonly emoji: string | null;
    readonly dailyCost: string | null;
    readonly startedAt: string;
    readonly archivedAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly currentDays: number;
    readonly bestDays: number;
    readonly attemptCount: number;
    readonly moneyNotSpent: string | null;
};

export type CountersOverview = {
    readonly counters: CounterOverviewRow[];
    readonly date: string;
};

export class GetCountersOverviewQuery extends Query<CountersOverview> {}

export class GetCountersOverviewQueryHandler implements RequestHandler<GetCountersOverviewQuery, CountersOverview> {
    constructor(
        private readonly counters: CounterRepository,
        private readonly eventBus: EventBus,
    ) {}

    async handle(_query: GetCountersOverviewQuery, identity: Identity): Promise<CountersOverview> {
        const { userId } = requireUserIdentity(identity);
        const today = todayISO();
        const activeCounters = await this.counters.listCounters(userId);

        const rows: CounterOverviewRow[] = [];
        for (const counter of activeCounters) {
            await this.notifyPendingMilestone(userId, counter, today);
            rows.push(await this.buildRow(userId, counter, today));
        }

        return { counters: rows, date: today };
    }

    async buildRow(userId: string, counter: Counter, today: string = todayISO()): Promise<CounterOverviewRow> {
        const currentDays = Math.max(0, diffLocalDateISODays(counter.startedAt, today));
        const attempts = await this.counters.getAttempts(userId, counter.id);
        const bestPastAttempt = attempts.reduce((best, attempt) => Math.max(best, attempt.days), 0);

        return {
            id: counter.id,
            name: counter.name,
            emoji: counter.emoji,
            dailyCost: counter.dailyCost,
            startedAt: counter.startedAt,
            archivedAt: counter.archivedAt,
            createdAt: counter.createdAt,
            updatedAt: counter.updatedAt,
            currentDays,
            bestDays: Math.max(currentDays, bestPastAttempt),
            attemptCount: attempts.length + 1,
            moneyNotSpent: moneyNotSpent(currentDays, counter.dailyCost),
        };
    }

    private async notifyPendingMilestone(userId: string, counter: Counter, today: string): Promise<void> {
        const currentDays = Math.max(0, diffLocalDateISODays(counter.startedAt, today));
        const milestone = pendingMilestone(currentDays, counter.lastMilestoneNotified);
        if (milestone === null) return;

        counter.markMilestoneNotified(milestone);
        await this.counters.save(userId, counter);

        void this.eventBus.emit(new CounterMilestone({
            userId,
            counterId: counter.id,
            counterName: counter.name,
            days: milestone,
            currentDays,
            moneyNotSpent: moneyNotSpent(currentDays, counter.dailyCost),
        }));
    }
}
