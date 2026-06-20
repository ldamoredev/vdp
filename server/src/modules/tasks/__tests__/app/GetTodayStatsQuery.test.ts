import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetTodayStatsQuery, GetTodayStatsQueryHandler } from '../../app/GetTodayStatsQuery';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext } from './task-cqbus-test-helpers';

describe('GetTodayStatsQuery', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns today stats for the authenticated user', async () => {
        ctx.tasks.seed([
            createTask({ id: 'task-1', scheduledDate: '2026-06-17', status: 'done' }),
            createTask({ id: 'task-2', scheduledDate: '2026-06-17', status: 'pending' }),
            createTask({ id: 'task-3', scheduledDate: '2026-06-17', status: 'in_progress' }),
        ]);

        const stats = await new GetTodayStatsQueryHandler(ctx.tasks)
            .handle(new GetTodayStatsQuery(), identity);

        expect(stats).toMatchObject({ date: '2026-06-17', total: 3, completed: 1, pending: 2, completionRate: 33 });
    });
});
