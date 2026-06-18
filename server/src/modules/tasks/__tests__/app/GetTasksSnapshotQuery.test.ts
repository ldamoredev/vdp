import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetTasksSnapshotQuery, GetTasksSnapshotQueryHandler } from '../../app/GetTasksSnapshotQuery';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext } from './task-cqbus-test-helpers';

describe('GetTasksSnapshotQuery', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns today snapshot for the authenticated user', async () => {
        ctx.tasks.seed([
            createTask({ id: 'task-1', title: 'Stuck', scheduledDate: '2026-06-17', carryOverCount: 3 }),
            createTask({ id: 'task-2', scheduledDate: '2026-06-17', status: 'done' }),
        ]);

        const snapshot = await new GetTasksSnapshotQueryHandler(ctx.tasks)
            .handle(new GetTasksSnapshotQuery(), identity);

        expect(snapshot).toMatchObject({
            pendingCount: 1,
            completedCount: 1,
            totalCount: 2,
            completionRate: 50,
            stuckTasks: [{ title: 'Stuck', carryOverCount: 3 }],
        });
    });
});
