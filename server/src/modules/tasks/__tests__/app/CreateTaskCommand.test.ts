import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateTaskCommand, CreateTaskCommandHandler } from '../../app/CreateTaskCommand';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext, userId } from './task-cqbus-test-helpers';

describe('CreateTaskCommand', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('creates a task and schedules embedding for the authenticated user', async () => {
        const result = await new CreateTaskCommandHandler(ctx.tasks, ctx.embedTask, ctx.findSimilarTasks)
            .handle(new CreateTaskCommand({
                title: 'Write report',
                description: 'Quarterly notes',
                priority: 1,
                scheduledDate: '2026-06-17',
                domain: 'work',
            }), identity);

        expect(result.task).toMatchObject({
            title: 'Write report',
            description: 'Quarterly notes',
            priority: 1,
            scheduledDate: '2026-06-17',
            domain: 'work',
        });
        expect(ctx.executeInBackground).toHaveBeenCalledWith(userId, result.task.id);
    });
});
