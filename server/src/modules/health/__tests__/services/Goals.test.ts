import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';
import { DeadlineStage, Goal, GoalStatus } from '../../domain/Goal';
import { CompleteGoal } from '../../services/CompleteGoal';
import { CreateGoal } from '../../services/CreateGoal';
import { DropGoal } from '../../services/DropGoal';
import { GetGoalsOverview } from '../../services/GetGoalsOverview';
import { GraduateGoal } from '../../services/GraduateGoal';
import { CreateHabit } from '../../services/CreateHabit';
import { FakeGoalRepository } from '../fakes/FakeGoalRepository';
import { FakeHabitRepository } from '../fakes/FakeHabitRepository';

const userId = 'user-1';
const TODAY = '2026-06-12';

function makeGoal(overrides: Partial<{
    title: string;
    targetDate: string;
    status: GoalStatus;
    deadlineNotified: DeadlineStage;
}> = {}): Goal {
    return new Goal(
        randomUUID(),
        overrides.title ?? 'Empezar el gym',
        null,
        overrides.targetDate ?? '2026-07-01',
        overrides.status ?? 'active',
        overrides.deadlineNotified ?? 'none',
        null,
        new Date(),
        new Date(),
    );
}

describe('goals', () => {
    let repo: FakeGoalRepository;
    let eventBus: EventBus;
    let emitted: DomainEvent[];

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 12, 12, 0, 0));
        repo = new FakeGoalRepository();
        eventBus = new EventBus();
        emitted = [];
        eventBus.on('health.goal.deadline_approaching', (e) => { emitted.push(e); });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('CreateGoal', () => {
        it('creates active goals and rejects non-future target dates', async () => {
            const service = new CreateGoal(repo);

            const goal = await service.execute(userId, { title: 'Empezar dieta', targetDate: '2026-06-30' });
            expect(goal.status).toBe('active');
            expect(goal.deadlineNotified).toBe('none');

            await expect(service.execute(userId, { title: 'Hoy', targetDate: TODAY }))
                .rejects.toMatchObject({ statusCode: 422 });
            await expect(service.execute(userId, { title: 'Ayer', targetDate: '2026-06-11' }))
                .rejects.toMatchObject({ statusCode: 422 });
        });
    });

    describe('GetGoalsOverview deadline detection', () => {
        it('emits t7 once when the deadline is within a week', async () => {
            repo.seedGoal(userId, makeGoal({ targetDate: '2026-06-17' })); // 5 days left

            const service = new GetGoalsOverview(repo, eventBus);
            await service.execute(userId);
            await service.execute(userId);

            expect(emitted).toHaveLength(1);
            expect(emitted[0].payload).toMatchObject({ title: 'Empezar el gym', daysLeft: 5 });
        });

        it('escalates to t1 after t7 was already notified', async () => {
            repo.seedGoal(userId, makeGoal({ targetDate: '2026-06-13', deadlineNotified: 't7' })); // 1 day left

            await new GetGoalsOverview(repo, eventBus).execute(userId);

            expect(emitted).toHaveLength(1);
            expect((emitted[0].payload as { daysLeft: number }).daysLeft).toBe(1);
        });

        it('jumps straight to t1 when first seen overdue (skips t7)', async () => {
            const goal = makeGoal({ targetDate: '2026-06-10' }); // overdue by 2
            repo.seedGoal(userId, goal);

            const service = new GetGoalsOverview(repo, eventBus);
            await service.execute(userId);
            await service.execute(userId);

            expect(emitted).toHaveLength(1);
            expect((emitted[0].payload as { daysLeft: number }).daysLeft).toBe(-2);
            expect(goal.deadlineNotified).toBe('t1');
        });

        it('stays silent for far deadlines and non-active goals', async () => {
            repo.seedGoal(userId, makeGoal({ targetDate: '2026-08-01' }));
            repo.seedGoal(userId, makeGoal({ targetDate: '2026-06-13', status: 'done' }));

            const overview = await new GetGoalsOverview(repo, eventBus).execute(userId);

            expect(emitted).toHaveLength(0);
            expect(overview.goals).toHaveLength(2);
        });
    });

    describe('transitions', () => {
        it('completes idempotently and rejects completing a dropped goal', async () => {
            const goal = makeGoal();
            repo.seedGoal(userId, goal);
            const service = new CompleteGoal(repo);

            const done = await service.execute(userId, goal.id);
            expect(done.status).toBe('done');
            expect(done.completedAt).not.toBeNull();
            await expect(service.execute(userId, goal.id)).resolves.toMatchObject({ status: 'done' });

            const dropped = makeGoal({ status: 'dropped' });
            repo.seedGoal(userId, dropped);
            await expect(service.execute(userId, dropped.id)).rejects.toMatchObject({ statusCode: 422 });
        });

        it('drops active goals but never done ones', async () => {
            const goal = makeGoal();
            repo.seedGoal(userId, goal);
            const service = new DropGoal(repo);

            await expect(service.execute(userId, goal.id)).resolves.toMatchObject({ status: 'dropped' });

            const done = makeGoal({ status: 'done' });
            repo.seedGoal(userId, done);
            await expect(service.execute(userId, done.id)).rejects.toMatchObject({ statusCode: 422 });
        });

        it('isolates goals between users', async () => {
            const goal = makeGoal();
            repo.seedGoal('someone-else', goal);

            await expect(new CompleteGoal(repo).execute(userId, goal.id))
                .rejects.toMatchObject({ statusCode: 404 });
        });
    });

    describe('GraduateGoal', () => {
        it('completes the goal and creates the habit', async () => {
            const goal = makeGoal({ title: 'Empezar el gym' });
            repo.seedGoal(userId, goal);
            const habits = new FakeHabitRepository();
            const service = new GraduateGoal(repo, new CreateHabit(habits));

            const result = await service.execute(userId, goal.id, {
                habitName: 'Gimnasio',
                emoji: '🏋️',
                cadence: 'weekly',
                weeklyTarget: 3,
            });

            expect(result.goal.status).toBe('done');
            expect(result.habit.name).toBe('Gimnasio');
            expect(result.habit.cadence).toBe('weekly');
            expect(result.habit.weeklyTarget).toBe(3);
            await expect(habits.listHabits(userId)).resolves.toHaveLength(1);
        });

        it('works on an already-done goal (UI offers conversion after completing)', async () => {
            const goal = makeGoal({ status: 'done' });
            repo.seedGoal(userId, goal);
            const habits = new FakeHabitRepository();

            const result = await new GraduateGoal(repo, new CreateHabit(habits))
                .execute(userId, goal.id, { habitName: 'Dieta' });

            expect(result.habit.name).toBe('Dieta');
        });

        it('rejects graduating a dropped goal', async () => {
            const goal = makeGoal({ status: 'dropped' });
            repo.seedGoal(userId, goal);

            await expect(
                new GraduateGoal(repo, new CreateHabit(new FakeHabitRepository()))
                    .execute(userId, goal.id, { habitName: 'X' }),
            ).rejects.toMatchObject({ statusCode: 422 });
        });
    });
});
