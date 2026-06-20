import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';
import { DomainHttpError } from '../../../common/http/errors';
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

    it('completes an in-progress task for the authenticated user', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1', status: 'in_progress' })]);

        const task = await new CompleteTaskCommandHandler(ctx.tasks, ctx.eventBus)
            .handle(new CompleteTaskCommand('task-1'), identity);

        expect(task).toMatchObject({ id: 'task-1', status: 'done' });
    });

    it('emits a completion event for the authenticated user', async () => {
        const emittedEvents: DomainEvent[] = [];
        ctx.eventBus.onAll((event) => {
            emittedEvents.push(event);
        });
        ctx.tasks.seed([createTask({
            id: 'task-1',
            scheduledDate: '2026-06-17',
            title: 'Pagar el alquiler',
            domain: 'finanzas',
        })]);

        await new CompleteTaskCommandHandler(ctx.tasks, ctx.eventBus)
            .handle(new CompleteTaskCommand('task-1'), identity);

        expect(emittedEvents[0]).toMatchObject({
            domain: 'tasks',
            type: 'task.completed',
            payload: {
                userId: 'user-1',
                taskId: 'task-1',
                scheduledDate: '2026-06-17',
                title: 'Pagar el alquiler',
                domain: 'finanzas',
            },
        });
    });

    it('rejects completing terminal tasks', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1', status: 'discarded' })]);

        await expect(
            new CompleteTaskCommandHandler(ctx.tasks, ctx.eventBus)
                .handle(new CompleteTaskCommand('task-1'), identity),
        ).rejects.toThrow(DomainHttpError);
    });
});
