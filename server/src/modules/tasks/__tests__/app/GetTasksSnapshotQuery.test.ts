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
            createTask({ id: 'task-3', title: 'Started', scheduledDate: '2026-06-17', status: 'in_progress' }),
        ]);

        const snapshot = await new GetTasksSnapshotQueryHandler(ctx.tasks)
            .handle(new GetTasksSnapshotQuery(), identity);

        expect(snapshot).toMatchObject({
            pendingCount: 2,
            completedCount: 1,
            totalCount: 3,
            completionRate: 33,
            stuckTasks: [{ title: 'Stuck', carryOverCount: 3 }],
        });
    });

    it('counts tasks completed today even when they were scheduled earlier', async () => {
        ctx.tasks.seed([
            createTask({
                id: 'task-completed-today',
                title: 'Completed today',
                scheduledDate: '2026-06-16',
                status: 'done',
                completedAt: new Date('2026-06-17T09:15:00.000Z'),
            }),
            createTask({
                id: 'task-pending-today',
                title: 'Pending today',
                scheduledDate: '2026-06-17',
                status: 'pending',
            }),
            createTask({
                id: 'task-progress-today',
                title: 'Progress today',
                scheduledDate: '2026-06-17',
                status: 'in_progress',
            }),
        ]);

        const snapshot = await new GetTasksSnapshotQueryHandler(ctx.tasks)
            .handle(new GetTasksSnapshotQuery(), identity);

        expect(snapshot).toMatchObject({
            pendingCount: 2,
            completedCount: 1,
            totalCount: 3,
            completionRate: 33,
        });
    });
});
