import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';
import { Counter } from '../../domain/Counter';
import { CreateCounter } from '../../services/CreateCounter';
import { GetCountersOverview } from '../../services/GetCountersOverview';
import { RelapseCounter } from '../../services/RelapseCounter';
import { FakeCounterRepository } from '../fakes/FakeCounterRepository';

const userId = 'user-1';
const TODAY = '2026-06-12';

function makeCounter(overrides: Partial<{
    name: string;
    startedAt: string;
    dailyCost: string | null;
    lastMilestoneNotified: number;
}> = {}): Counter {
    return new Counter(
        randomUUID(),
        overrides.name ?? 'Sin fumar',
        null,
        overrides.dailyCost ?? null,
        overrides.startedAt ?? TODAY,
        overrides.lastMilestoneNotified ?? 0,
        null,
        new Date(),
        new Date(),
    );
}

describe('counters', () => {
    let repo: FakeCounterRepository;
    let eventBus: EventBus;
    let emitted: DomainEvent[];

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 12, 12, 0, 0));
        repo = new FakeCounterRepository();
        eventBus = new EventBus();
        emitted = [];
        eventBus.on('health.counter.milestone', (e) => { emitted.push(e); });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('CreateCounter', () => {
        it('defaults to today and rejects future start dates', async () => {
            const service = new CreateCounter(repo);

            const counter = await service.execute(userId, { name: 'Sin fumar' });
            expect(counter.startedAt).toBe(TODAY);
            expect(counter.lastMilestoneNotified).toBe(0);

            await expect(
                service.execute(userId, { name: 'Mal', startedAt: '2026-06-13' }),
            ).rejects.toMatchObject({ statusCode: 422 });
        });

        it('suppresses retroactive milestones for counters started in the past', async () => {
            const service = new CreateCounter(repo);

            // Quit 90 days ago: milestones 1/7/30 already happened back then.
            const counter = await service.execute(userId, {
                name: 'Sin fumar',
                startedAt: '2026-03-14', // 90 days before TODAY
            });

            expect(counter.lastMilestoneNotified).toBe(30);
        });
    });

    describe('GetCountersOverview', () => {
        it('builds rows with current days, best attempt, and money not spent', async () => {
            const counter = makeCounter({ startedAt: '2026-06-02', dailyCost: '1000.00' });
            repo.seedCounter(userId, counter);
            await repo.addAttempt(userId, counter.id, {
                startedAt: '2026-01-01',
                endedAt: '2026-01-25',
                days: 24,
            });

            const overview = await new GetCountersOverview(repo, eventBus).execute(userId);

            expect(overview.counters[0]).toMatchObject({
                currentDays: 10,
                bestDays: 24,
                attemptCount: 2,
                moneyNotSpent: '10000.00',
            });
        });

        it('emits the pending milestone once and dedupes it', async () => {
            const counter = makeCounter({
                startedAt: '2026-06-05', // 7 days ago
                dailyCost: '1000.00',
                lastMilestoneNotified: 1,
            });
            repo.seedCounter(userId, counter);

            const service = new GetCountersOverview(repo, eventBus);
            await service.execute(userId);
            await service.execute(userId);

            expect(emitted).toHaveLength(1);
            expect(emitted[0].payload).toMatchObject({
                counterName: 'Sin fumar',
                days: 7,
                currentDays: 7,
                moneyNotSpent: '7000.00',
            });
            expect(counter.lastMilestoneNotified).toBe(7);
        });

        it('does not emit when no new milestone was crossed', async () => {
            repo.seedCounter(userId, makeCounter({ startedAt: '2026-06-08', lastMilestoneNotified: 1 }));

            await new GetCountersOverview(repo, eventBus).execute(userId);

            expect(emitted).toHaveLength(0);
        });
    });

    describe('RelapseCounter', () => {
        it('archives the attempt and restarts the counter at the relapse date', async () => {
            const counter = makeCounter({ startedAt: '2026-05-01', lastMilestoneNotified: 30 });
            repo.seedCounter(userId, counter);

            const service = new RelapseCounter(repo);
            const updated = await service.execute(userId, counter.id);

            expect(updated.startedAt).toBe(TODAY);
            expect(updated.lastMilestoneNotified).toBe(0);

            const attempts = repo.attemptsFor(counter.id);
            expect(attempts).toHaveLength(1);
            expect(attempts[0]).toMatchObject({
                startedAt: '2026-05-01',
                endedAt: TODAY,
                days: 42,
            });
        });

        it('rejects future dates, dates before the attempt, and other users', async () => {
            const counter = makeCounter({ startedAt: '2026-06-01' });
            repo.seedCounter(userId, counter);
            const service = new RelapseCounter(repo);

            await expect(service.execute(userId, counter.id, '2026-06-13')).rejects.toMatchObject({ statusCode: 422 });
            await expect(service.execute(userId, counter.id, '2026-05-31')).rejects.toMatchObject({ statusCode: 422 });
            await expect(service.execute('someone-else', counter.id)).rejects.toMatchObject({ statusCode: 404 });
        });
    });
});
