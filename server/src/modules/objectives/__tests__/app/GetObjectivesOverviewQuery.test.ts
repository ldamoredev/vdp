import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EventBus } from '../../../common/base/event-bus/EventBus';
import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';
import { UserIdentity } from '../../../common/app/auth/UserIdentity';
import { CreateObjectiveData } from '../../domain/ObjectiveRepository';
import { GetObjectivesOverviewQuery, GetObjectivesOverviewQueryHandler } from '../../app/GetObjectivesOverviewQuery';
import { FakeObjectiveRepository } from '../fakes/FakeObjectiveRepository';

const userId = 'user-1';
const identity = new UserIdentity(userId, 'test@example.com', 'Test', ['user']);

function makeObjective(overrides: Partial<CreateObjectiveData> = {}): CreateObjectiveData {
    return {
        title: 'Test objective',
        periodStart: '2026-07-01',
        periodEnd: '2026-09-30',
        metricSource: 'manual',
        target: 10,
        unit: 'puntos',
        manualValue: 3,
        ...overrides,
    };
}

describe('GetObjectivesOverviewQuery', () => {
    let objectives: FakeObjectiveRepository;
    let eventBus: EventBus;
    let emitted: DomainEvent[];

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 8, 16, 12, 0, 0)); // 2026-09-16
        objectives = new FakeObjectiveRepository();
        eventBus = new EventBus();
        emitted = [];
        eventBus.on('objectives.objective.deadline_approaching', (event) => {
            emitted.push(event);
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('emits deadline approaching for a short objective within 14 days', async () => {
        vi.setSystemTime(new Date(2026, 5, 20, 12, 0, 0)); // 2026-06-20
        await objectives.createObjective(userId, makeObjective({
            periodStart: '2026-06-01',
            periodEnd: '2026-07-04',
            manualValue: 3,
        }));

        const overview = await new GetObjectivesOverviewQueryHandler(objectives, eventBus)
            .handle(new GetObjectivesOverviewQuery(), identity);

        expect(overview.objectives).toHaveLength(1);
        expect(emitted).toHaveLength(1);
        expect(emitted[0].payload).toMatchObject({
            title: 'Test objective',
            daysLeft: 14,
            progress: 3,
            target: 10,
        });
    });

    it('emits at 30 days for a long objective and again at 14 days', async () => {
        vi.setSystemTime(new Date(2026, 10, 1, 12, 0, 0)); // 2026-11-01, 30 days before 2026-12-01
        const created = await objectives.createObjective(userId, makeObjective({
            periodStart: '2026-01-01',
            periodEnd: '2026-12-01',
            manualValue: 3,
        }));

        await new GetObjectivesOverviewQueryHandler(objectives, eventBus)
            .handle(new GetObjectivesOverviewQuery(), identity);

        expect(emitted).toHaveLength(1);
        expect(emitted[0].payload).toMatchObject({ daysLeft: 30 });

        vi.setSystemTime(new Date(2026, 10, 17, 12, 0, 0)); // 2026-11-17, 14 days before
        const saved = await objectives.getObjective(userId, created.id);
        if (saved) {
            await objectives.save(userId, saved);
        }

        emitted.length = 0;
        await new GetObjectivesOverviewQueryHandler(objectives, eventBus)
            .handle(new GetObjectivesOverviewQuery(), identity);

        expect(emitted).toHaveLength(1);
        expect(emitted[0].payload).toMatchObject({ daysLeft: 14 });
    });

    it('does not emit when the manual objective has reached its target', async () => {
        await objectives.createObjective(userId, makeObjective({ manualValue: 10 }));

        await new GetObjectivesOverviewQueryHandler(objectives, eventBus)
            .handle(new GetObjectivesOverviewQuery(), identity);

        expect(emitted).toHaveLength(0);
    });

    it('does not emit for archived or achieved objectives', async () => {
        const archived = await objectives.createObjective(userId, makeObjective());
        archived.archive();
        await objectives.save(userId, archived);

        const achieved = await objectives.createObjective(userId, makeObjective({ title: 'Achieved' }));
        achieved.markAchieved();
        await objectives.save(userId, achieved);

        await new GetObjectivesOverviewQueryHandler(objectives, eventBus)
            .handle(new GetObjectivesOverviewQuery(), identity);

        expect(emitted).toHaveLength(0);
    });

    it('dedupes repeated loads so the event fires exactly once per threshold', async () => {
        await objectives.createObjective(userId, makeObjective({ periodEnd: '2026-09-30' }));

        await new GetObjectivesOverviewQueryHandler(objectives, eventBus)
            .handle(new GetObjectivesOverviewQuery(), identity);
        await new GetObjectivesOverviewQueryHandler(objectives, eventBus)
            .handle(new GetObjectivesOverviewQuery(), identity);

        expect(emitted).toHaveLength(1);
    });

    it('after a long gap emits only the highest crossed threshold', async () => {
        vi.setSystemTime(new Date(2026, 10, 17, 12, 0, 0)); // 2026-11-17
        await objectives.createObjective(userId, makeObjective({
            periodStart: '2026-01-01',
            periodEnd: '2026-12-01',
            manualValue: 3,
        }));

        await new GetObjectivesOverviewQueryHandler(objectives, eventBus)
            .handle(new GetObjectivesOverviewQuery(), identity);

        expect(emitted).toHaveLength(1);
        expect(emitted[0].payload).toMatchObject({ daysLeft: 14 });
    });
});
