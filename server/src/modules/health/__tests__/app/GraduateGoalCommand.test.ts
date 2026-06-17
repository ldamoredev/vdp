import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';

import { GraduateGoalCommand, GraduateGoalCommandHandler } from '../../app/GraduateGoalCommand';
import { identity, makeGoal, setupHealthCQBusTest, userId, type HealthCQBusTestContext } from './health-cqbus-test-helpers';

describe('GraduateGoalCommand', () => {
    let ctx: HealthCQBusTestContext;

    beforeEach(() => {
        ctx = setupHealthCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('completes the goal and creates the habit', async () => {
        const goal = makeGoal();
        ctx.goals.seedGoal(userId, goal);

        const result = await new GraduateGoalCommandHandler(ctx.goals, ctx.habits, ctx.eventBus)
            .handle(new GraduateGoalCommand(goal.id, { habitName: 'Gimnasio', cadence: 'weekly', weeklyTarget: 3 }), identity);

        expect(result.goal.status).toBe('done');
        expect(result.habit).toMatchObject({ name: 'Gimnasio', cadence: 'weekly', weeklyTarget: 3 });
        await expect(ctx.habits.listHabits(userId)).resolves.toHaveLength(1);
    });
});
