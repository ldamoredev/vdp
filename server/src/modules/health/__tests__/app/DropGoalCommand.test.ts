import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';

import { DropGoalCommand, DropGoalCommandHandler } from '../../app/DropGoalCommand';
import { identity, makeGoal, setupHealthCQBusTest, userId, type HealthCQBusTestContext } from './health-cqbus-test-helpers';

describe('DropGoalCommand', () => {
    let ctx: HealthCQBusTestContext;

    beforeEach(() => {
        ctx = setupHealthCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('drops the goal and returns its overview row', async () => {
        const goal = makeGoal('2026-06-30');
        ctx.goals.seedGoal(userId, goal);

        const row = await new DropGoalCommandHandler(ctx.goals, ctx.eventBus)
            .handle(new DropGoalCommand(goal.id), identity);

        expect(row.status).toBe('dropped');
    });
});
