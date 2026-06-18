import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DeleteTaskCommand, DeleteTaskCommandHandler } from '../../app/DeleteTaskCommand';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext } from './task-cqbus-test-helpers';

describe('DeleteTaskCommand', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('deletes a task and its notes for the authenticated user', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1', title: 'Delete me' })]);
        await ctx.notes.addNote('user-1', 'task-1', 'Temporary note', 'note');

        const deleted = await new DeleteTaskCommandHandler(ctx.tasks, ctx.notes)
            .handle(new DeleteTaskCommand('task-1'), identity);

        expect(deleted?.title).toBe('Delete me');
        expect(await ctx.tasks.getTask('user-1', 'task-1')).toBeNull();
        expect(await ctx.notes.listNotes('user-1', 'task-1')).toEqual([]);
    });
});
