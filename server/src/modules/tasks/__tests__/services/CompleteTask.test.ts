import { describe, it, expect, beforeEach } from 'vitest';
import { CompleteTask } from '../../services/CompleteTask';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { createTask } from '../fakes/task-factory';
import type { DomainEvent } from '../../../common/base/event-bus/DomainEvent';
import { DomainHttpError } from '../../../common/http/errors';

describe('CompleteTask', () => {
    let repo: FakeTaskRepository;
    let eventBus: EventBus;
    let service: CompleteTask;
    let emittedEvents: DomainEvent[];

    beforeEach(() => {
        repo = new FakeTaskRepository();
        eventBus = new EventBus();
        service = new CompleteTask(repo, eventBus);
        emittedEvents = [];

        eventBus.onAll((event) => {
            emittedEvents.push(event);
        });
    });

    it('returns null when task does not exist', async () => {
        const result = await service.execute('nonexistent-id');
        expect(result).toBeNull();
    });

    it('marks task as done and saves', async () => {
        const task = createTask({ status: 'pending' });
        repo.seed([task]);

        const result = await service.execute(task.id);

        expect(result).not.toBeNull();
        expect(result!.status).toBe('done');
        expect(result!.completedAt).toBeInstanceOf(Date);

        // Verify persisted
        const saved = await repo.getTask(task.id);
        expect(saved!.status).toBe('done');
    });

    it('rejects completing an already done task', async () => {
        const task = createTask({ status: 'done', completedAt: new Date() });
        repo.seed([task]);

        await expect(service.execute(task.id)).rejects.toThrow(DomainHttpError);
    });

    it('rejects completing a discarded task', async () => {
        const task = createTask({ status: 'discarded' });
        repo.seed([task]);

        await expect(service.execute(task.id)).rejects.toThrow(DomainHttpError);
    });

    it('emits TaskCompleted event with correct payload', async () => {
        const task = createTask({ scheduledDate: '2026-03-18' });
        repo.seed([task]);

        await service.execute(task.id);

        expect(emittedEvents).toHaveLength(1);
        expect(emittedEvents[0].domain).toBe('tasks');
        expect(emittedEvents[0].type).toBe('task.completed');
        expect(emittedEvents[0].payload).toEqual({
            taskId: task.id,
            scheduledDate: '2026-03-18',
        });
    });
});
