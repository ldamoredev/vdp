import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetCarryOverRateQuery, GetCarryOverRateQueryHandler } from '../../app/GetCarryOverRateQuery';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext } from './task-cqbus-test-helpers';

describe('GetCarryOverRateQuery', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns carry-over rate for the authenticated user', async () => {
        ctx.tasks.seed([
            createTask({ id: 'task-1', scheduledDate: '2026-06-16', carryOverCount: 1 }),
            createTask({ id: 'task-2', scheduledDate: '2026-06-17', carryOverCount: 0 }),
        ]);

        const rate = await new GetCarryOverRateQueryHandler(ctx.tasks)
            .handle(new GetCarryOverRateQuery(7), identity);

        expect(rate).toEqual({ total: 2, carriedOver: 1, rate: 50, days: 7 });
    });
});
