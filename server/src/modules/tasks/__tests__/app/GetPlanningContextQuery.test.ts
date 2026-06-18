import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetPlanningContextQuery, GetPlanningContextQueryHandler } from '../../app/GetPlanningContextQuery';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext, userId } from './task-cqbus-test-helpers';

describe('GetPlanningContextQuery', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns planning context with stuck tasks and insights for the authenticated user', async () => {
        ctx.tasks.seed([
            createTask({ id: 'task-1', title: 'Stuck task', scheduledDate: '2026-06-17', carryOverCount: 3 }),
        ]);
        ctx.insightsStore.addInsight({
            userId,
            type: 'suggestion',
            title: 'Plan light',
            message: 'Keep today focused',
        });

        const context = await new GetPlanningContextQueryHandler(ctx.tasks, ctx.insightsStore)
            .handle(new GetPlanningContextQuery(), identity);

        expect(context.stuckTasks).toEqual([{ id: 'task-1', title: 'Stuck task', carryOverCount: 3 }]);
        expect(context.insights.totalInsights).toBe(1);
        expect(context.recommendations).toContain(
            'Tenés 1 tareas estancadas. Recomendamos dividirlas en pasos más chicos o descartarlas.',
        );
    });
});
