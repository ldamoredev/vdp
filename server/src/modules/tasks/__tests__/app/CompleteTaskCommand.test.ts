import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CompleteTaskCommand, CompleteTaskCommandHandler } from '../../app/CompleteTaskCommand';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext } from './task-cqbus-test-helpers';

describe('CompleteTaskCommand', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('completes a pending task for the authenticated user', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1', status: 'pending' })]);

        const task = await new CompleteTaskCommandHandler(ctx.tasks, ctx.eventBus)
            .handle(new CompleteTaskCommand('task-1'), identity);

        expect(task).toMatchObject({ id: 'task-1', status: 'done' });
        expect(task?.completedAt).toEqual(new Date(2026, 5, 17, 12, 0, 0));
    });
});
