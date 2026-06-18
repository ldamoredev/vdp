import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    CarryOverAllPendingCommand,
    CarryOverAllPendingCommandHandler,
} from '../../app/CarryOverAllPendingCommand';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext } from './task-cqbus-test-helpers';

describe('CarryOverAllPendingCommand', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('carries over all pending tasks from one day', async () => {
        ctx.tasks.seed([
            createTask({ id: 'task-1', scheduledDate: '2026-06-17', status: 'pending' }),
            createTask({ id: 'task-2', scheduledDate: '2026-06-17', status: 'done' }),
            createTask({ id: 'task-3', scheduledDate: '2026-06-18', status: 'pending' }),
        ]);

        const tasks = await new CarryOverAllPendingCommandHandler(ctx.tasks, ctx.eventBus, ctx.detectRepeatPattern)
            .handle(new CarryOverAllPendingCommand('2026-06-17', '2026-06-18'), identity);

        expect(tasks).toHaveLength(1);
        expect(tasks[0]).toMatchObject({ id: 'task-1', scheduledDate: '2026-06-18', carryOverCount: 1 });
    });
});
