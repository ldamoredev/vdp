import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetTasksQuery, GetTasksQueryHandler } from '../../app/GetTasksQuery';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext } from './task-cqbus-test-helpers';

describe('GetTasksQuery', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('lists tasks for the authenticated user using filters', async () => {
        ctx.tasks.seed([
            createTask({ id: 'task-1', title: 'Today', scheduledDate: '2026-06-17' }),
            createTask({ id: 'task-2', title: 'Tomorrow', scheduledDate: '2026-06-18' }),
        ]);

        const result = await new GetTasksQueryHandler(ctx.tasks)
            .handle(new GetTasksQuery({ scheduledDate: '2026-06-17' }), identity);

        expect(result.tasks).toHaveLength(1);
        expect(result.tasks[0].title).toBe('Today');
        expect(result.total).toBe(1);
    });
});
