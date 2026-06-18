import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetTrendStatsQuery, GetTrendStatsQueryHandler } from '../../app/GetTrendStatsQuery';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext } from './task-cqbus-test-helpers';

describe('GetTrendStatsQuery', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns trend stats for the authenticated user', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1', scheduledDate: '2026-06-17', status: 'done' })]);

        const trend = await new GetTrendStatsQueryHandler(ctx.tasks)
            .handle(new GetTrendStatsQuery(2), identity);

        expect(trend).toHaveLength(2);
        expect(trend[0]).toMatchObject({ date: '2026-06-17', total: 1, completed: 1 });
    });
});
