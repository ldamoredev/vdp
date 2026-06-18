import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetTaskQuery, GetTaskQueryHandler } from '../../app/GetTaskQuery';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext } from './task-cqbus-test-helpers';

describe('GetTaskQuery', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('gets a task with notes for the authenticated user', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1', title: 'Write plan' })]);
        await ctx.notes.addNote('user-1', 'task-1', 'First note', 'note');

        const result = await new GetTaskQueryHandler(ctx.tasks, ctx.notes)
            .handle(new GetTaskQuery('task-1'), identity);

        expect(result?.task.title).toBe('Write plan');
        expect(result?.notes).toMatchObject([{ taskId: 'task-1', content: 'First note', type: 'note' }]);
    });
});
