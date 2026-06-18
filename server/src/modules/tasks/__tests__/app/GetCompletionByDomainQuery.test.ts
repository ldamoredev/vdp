import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    GetCompletionByDomainQuery,
    GetCompletionByDomainQueryHandler,
} from '../../app/GetCompletionByDomainQuery';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext } from './task-cqbus-test-helpers';

describe('GetCompletionByDomainQuery', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns completed task counts by domain for the authenticated user', async () => {
        ctx.tasks.seed([
            createTask({ id: 'task-1', scheduledDate: '2026-06-16', status: 'done', domain: 'work' }),
            createTask({ id: 'task-2', scheduledDate: '2026-06-17', status: 'done', domain: 'work' }),
            createTask({ id: 'task-3', scheduledDate: '2026-06-17', status: 'pending', domain: 'health' }),
        ]);

        const stats = await new GetCompletionByDomainQueryHandler(ctx.tasks)
            .handle(new GetCompletionByDomainQuery('2026-06-16', '2026-06-17'), identity);

        expect(stats).toEqual([{ domain: 'work', count: 2 }]);
    });
});
