import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DomainHttpError } from '../../../common/http/errors';
import { UpdateTaskCommand, UpdateTaskCommandHandler } from '../../app/UpdateTaskCommand';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext, userId } from './task-cqbus-test-helpers';

describe('UpdateTaskCommand', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('updates a pending task and schedules embedding for the authenticated user', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1', title: 'Old title' })]);

        const task = await new UpdateTaskCommandHandler(ctx.tasks, ctx.embedTask)
            .handle(new UpdateTaskCommand('task-1', { title: 'New title', priority: 3 }), identity);

        expect(task).toMatchObject({ id: 'task-1', title: 'New title', priority: 3 });
        expect(ctx.executeInBackground).toHaveBeenCalledWith(userId, 'task-1');
    });

    it('returns null when the task does not exist', async () => {
        const task = await new UpdateTaskCommandHandler(ctx.tasks, ctx.embedTask)
            .handle(new UpdateTaskCommand('missing', { title: 'New title' }), identity);

        expect(task).toBeNull();
        expect(ctx.executeInBackground).not.toHaveBeenCalled();
    });

    it('rejects updates on non-pending tasks', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1', status: 'done', completedAt: new Date() })]);

        await expect(
            new UpdateTaskCommandHandler(ctx.tasks, ctx.embedTask)
                .handle(new UpdateTaskCommand('task-1', { title: 'Nope' }), identity),
        ).rejects.toThrow(DomainHttpError);
    });
});
