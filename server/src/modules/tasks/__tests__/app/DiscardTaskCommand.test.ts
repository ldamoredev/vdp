import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DiscardTaskCommand, DiscardTaskCommandHandler } from '../../app/DiscardTaskCommand';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext } from './task-cqbus-test-helpers';

describe('DiscardTaskCommand', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('discards a pending task for the authenticated user', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1', status: 'pending' })]);

        const task = await new DiscardTaskCommandHandler(ctx.tasks)
            .handle(new DiscardTaskCommand('task-1'), identity);

        expect(task).toMatchObject({ id: 'task-1', status: 'discarded' });
    });

    it('discards an in-progress task for the authenticated user', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1', status: 'in_progress' })]);

        const task = await new DiscardTaskCommandHandler(ctx.tasks)
            .handle(new DiscardTaskCommand('task-1'), identity);

        expect(task).toMatchObject({ id: 'task-1', status: 'discarded' });
    });
});
