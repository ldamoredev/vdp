import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CarryOverTaskCommand, CarryOverTaskCommandHandler } from '../../app/CarryOverTaskCommand';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext, userId } from './task-cqbus-test-helpers';

describe('CarryOverTaskCommand', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('carries over a pending task and checks repeat patterns for the authenticated user', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1', scheduledDate: '2026-06-17', carryOverCount: 1 })]);

        const task = await new CarryOverTaskCommandHandler(ctx.tasks, ctx.eventBus, ctx.detectRepeatPattern)
            .handle(new CarryOverTaskCommand('task-1', '2026-06-18'), identity);

        expect(task).toMatchObject({ id: 'task-1', scheduledDate: '2026-06-18', carryOverCount: 2 });
        expect(ctx.detectRepeat).toHaveBeenCalledWith(userId, task);
    });
});
