import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DomainHttpError } from '../../../common/http/errors';
import { StartTaskCommand, StartTaskCommandHandler } from '../../app/StartTaskCommand';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext } from './task-cqbus-test-helpers';

describe('StartTaskCommand', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('moves a pending task into progress for the authenticated user', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1', status: 'pending' })]);

        const task = await new StartTaskCommandHandler(ctx.tasks)
            .handle(new StartTaskCommand('task-1'), identity);

        expect(task).toMatchObject({ id: 'task-1', status: 'in_progress' });
    });

    it('returns null when the task does not exist', async () => {
        const task = await new StartTaskCommandHandler(ctx.tasks)
            .handle(new StartTaskCommand('missing'), identity);

        expect(task).toBeNull();
    });

    it('rejects starting terminal tasks', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1', status: 'done' })]);

        await expect(
            new StartTaskCommandHandler(ctx.tasks)
                .handle(new StartTaskCommand('task-1'), identity),
        ).rejects.toThrow(DomainHttpError);
    });
});
