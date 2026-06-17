import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';

import { GetGoalsOverviewQuery, GetGoalsOverviewQueryHandler } from '../../app/GetGoalsOverviewQuery';
import { identity, makeGoal, setupHealthCQBusTest, userId, type HealthCQBusTestContext } from './health-cqbus-test-helpers';

describe('GetGoalsOverviewQuery', () => {
    let ctx: HealthCQBusTestContext;

    beforeEach(() => {
        ctx = setupHealthCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns goals and keeps lazy deadline detection on overview load', async () => {
        ctx.goals.seedGoal(userId, makeGoal('2026-06-17'));

        const overview = await new GetGoalsOverviewQueryHandler(ctx.goals, ctx.eventBus)
            .handle(new GetGoalsOverviewQuery(), identity);

        expect(overview.goals).toHaveLength(1);
        expect(ctx.emitted).toHaveLength(1);
        expect(ctx.emitted[0].payload).toMatchObject({ title: 'Empezar el gym', daysLeft: 5 });
    });
});
