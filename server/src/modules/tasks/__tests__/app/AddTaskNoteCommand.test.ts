import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AddTaskNoteCommand, AddTaskNoteCommandHandler } from '../../app/AddTaskNoteCommand';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext, userId } from './task-cqbus-test-helpers';

describe('AddTaskNoteCommand', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('adds a note and schedules embedding for the authenticated user', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1' })]);

        const note = await new AddTaskNoteCommandHandler(ctx.tasks, ctx.notes, ctx.embedTask)
            .handle(new AddTaskNoteCommand('task-1', 'Important context', 'note'), identity);

        expect(note).toMatchObject({ taskId: 'task-1', content: 'Important context', type: 'note' });
        expect(ctx.executeInBackground).toHaveBeenCalledWith(userId, 'task-1');
    });

    it('rejects notes for missing tasks', async () => {
        await expect(
            new AddTaskNoteCommandHandler(ctx.tasks, ctx.notes, ctx.embedTask)
                .handle(new AddTaskNoteCommand('missing-task', 'Important context'), identity),
        ).rejects.toThrow('Task not found');
    });
});
