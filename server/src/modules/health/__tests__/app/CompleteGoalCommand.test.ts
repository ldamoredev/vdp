import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';

import { CompleteGoalCommand, CompleteGoalCommandHandler } from '../../app/CompleteGoalCommand';
import { identity, makeGoal, setupHealthCQBusTest, userId, type HealthCQBusTestContext } from './health-cqbus-test-helpers';

describe('CompleteGoalCommand', () => {
    let ctx: HealthCQBusTestContext;

    beforeEach(() => {
        ctx = setupHealthCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('completes the goal and returns its overview row', async () => {
        const goal = makeGoal('2026-06-30');
        ctx.goals.seedGoal(userId, goal);

        const row = await new CompleteGoalCommandHandler(ctx.goals, ctx.eventBus)
            .handle(new CompleteGoalCommand(goal.id), identity);

        expect(row.status).toBe('done');
        expect(row.completedAt).toBeInstanceOf(Date);
    });
});
