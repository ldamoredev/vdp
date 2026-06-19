import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';
import { DomainHttpError } from '../../../common/http/errors';
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

    it('rejects carrying over to the same or earlier day', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1', scheduledDate: '2026-06-17' })]);

        await expect(
            new CarryOverTaskCommandHandler(ctx.tasks, ctx.eventBus, ctx.detectRepeatPattern)
                .handle(new CarryOverTaskCommand('task-1', '2026-06-17'), identity),
        ).rejects.toThrow(DomainHttpError);
    });

    it('emits a stuck event when carry over count reaches the threshold', async () => {
        const emittedEvents: DomainEvent[] = [];
        ctx.eventBus.onAll((event) => {
            emittedEvents.push(event);
        });
        ctx.tasks.seed([createTask({
            id: 'task-1',
            title: 'Stuck task',
            scheduledDate: '2026-06-17',
            carryOverCount: 2,
        })]);

        await new CarryOverTaskCommandHandler(ctx.tasks, ctx.eventBus, ctx.detectRepeatPattern)
            .handle(new CarryOverTaskCommand('task-1', '2026-06-18'), identity);

        expect(emittedEvents[0]).toMatchObject({
            domain: 'tasks',
            type: 'task.stuck',
            payload: {
                userId: 'user-1',
                taskId: 'task-1',
                title: 'Stuck task',
                carryOverCount: 3,
            },
        });
    });
});
