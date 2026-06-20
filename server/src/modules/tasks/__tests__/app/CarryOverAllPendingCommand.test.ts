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

    it('carries over all open tasks from one day', async () => {
        ctx.tasks.seed([
            createTask({ id: 'task-1', scheduledDate: '2026-06-17', status: 'pending' }),
            createTask({ id: 'task-2', scheduledDate: '2026-06-17', status: 'in_progress' }),
            createTask({ id: 'task-3', scheduledDate: '2026-06-18', status: 'pending' }),
            createTask({ id: 'task-4', scheduledDate: '2026-06-17', status: 'done' }),
        ]);

        const tasks = await new CarryOverAllPendingCommandHandler(ctx.tasks, ctx.eventBus, ctx.detectRepeatPattern)
            .handle(new CarryOverAllPendingCommand('2026-06-17', '2026-06-18'), identity);

        expect(tasks).toHaveLength(2);
        expect(tasks.map((task) => task.id)).toEqual(['task-1', 'task-2']);
        expect(tasks[0]).toMatchObject({ scheduledDate: '2026-06-18', carryOverCount: 1 });
        expect(tasks[1]).toMatchObject({ scheduledDate: '2026-06-18', carryOverCount: 1, status: 'pending' });
    });
});
