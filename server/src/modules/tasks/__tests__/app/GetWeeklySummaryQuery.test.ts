import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetWeeklySummaryQuery, GetWeeklySummaryQueryHandler } from '../../app/GetWeeklySummaryQuery';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext } from './task-cqbus-test-helpers';

describe('GetWeeklySummaryQuery', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns weekly summary for the authenticated user', async () => {
        ctx.tasks.seed([
            createTask({ id: 'task-1', scheduledDate: '2026-06-17', status: 'done', domain: 'work' }),
            createTask({ id: 'task-2', scheduledDate: '2026-06-16', status: 'pending', carryOverCount: 1 }),
        ]);

        const summary = await new GetWeeklySummaryQueryHandler(ctx.tasks)
            .handle(new GetWeeklySummaryQuery(2), identity);

        expect(summary).toMatchObject({
            totalTasks: 2,
            completedTasks: 1,
            completionRate: 50,
            carryOverRate: 50,
            worstDomain: 'work',
        });
    });
});
