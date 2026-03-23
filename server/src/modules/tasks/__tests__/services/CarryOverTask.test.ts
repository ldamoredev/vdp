import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CarryOverTask } from '../../services/CarryOverTask';
import { DetectRepeatPattern } from '../../services/DetectRepeatPattern';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { createTask } from '../fakes/task-factory';
import type { DomainEvent } from '../../../common/base/event-bus/DomainEvent';
import { localDateISO } from '../../../common/base/time/dates';
import { DomainHttpError } from '../../../common/http/errors';

describe('CarryOverTask', () => {
    let repo: FakeTaskRepository;
    let eventBus: EventBus;
    let detectRepeatPattern: DetectRepeatPattern;
    let service: CarryOverTask;
    let emittedEvents: DomainEvent[];

    beforeEach(() => {
        repo = new FakeTaskRepository();
        eventBus = new EventBus();
        detectRepeatPattern = { execute: vi.fn().mockResolvedValue(undefined) } as any;
        service = new CarryOverTask(repo, eventBus, detectRepeatPattern);
        emittedEvents = [];

        eventBus.onAll((event) => {
            emittedEvents.push(event);
        });
    });

    it('returns null when task does not exist', async () => {
        const result = await service.execute('nonexistent-id');
        expect(result).toBeNull();
    });

    it('rejects carrying over a done task', async () => {
        const task = createTask({ status: 'done', completedAt: new Date() });
        repo.seed([task]);

        await expect(service.execute(task.id, '2026-03-20')).rejects.toThrow(DomainHttpError);
    });

    it('rejects carrying over a discarded task', async () => {
        const task = createTask({ status: 'discarded' });
        repo.seed([task]);

        await expect(service.execute(task.id, '2026-03-20')).rejects.toThrow(DomainHttpError);
    });

    it('carries over task with explicit toDate', async () => {
        const task = createTask({ scheduledDate: '2026-03-18', carryOverCount: 0 });
        repo.seed([task]);

        const result = await service.execute(task.id, '2026-03-20');

        expect(result!.scheduledDate).toBe('2026-03-20');
        expect(result!.carryOverCount).toBe(1);
        expect(result!.status).toBe('pending');
    });

    it('carries over to tomorrow when no toDate given', async () => {
        const task = createTask({ carryOverCount: 0 });
        repo.seed([task]);

        const result = await service.execute(task.id);

        // Should be tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const expectedDate = localDateISO(tomorrow);

        expect(result!.scheduledDate).toBe(expectedDate);
        expect(result!.carryOverCount).toBe(1);
    });

    it('does NOT emit TaskStuck when carryOverCount < 3', async () => {
        const task = createTask({ carryOverCount: 1 }); // will be 2 after carry over
        repo.seed([task]);

        await service.execute(task.id, '2026-03-19');

        expect(emittedEvents.filter(e => e.type === 'task.stuck')).toHaveLength(0);
    });

    it('emits TaskStuck when carryOverCount reaches 3', async () => {
        const task = createTask({ carryOverCount: 2, title: 'Stuck task' }); // will be 3 after carry over
        repo.seed([task]);

        await service.execute(task.id, '2026-03-19');

        const stuckEvent = emittedEvents.find(e => e.type === 'task.stuck');
        expect(stuckEvent).toBeDefined();
        expect(stuckEvent!.payload).toEqual({
            taskId: task.id,
            title: 'Stuck task',
            carryOverCount: 3,
        });
    });

    it('calls detectRepeatPattern after carry over', async () => {
        const task = createTask({ carryOverCount: 0 });
        repo.seed([task]);

        await service.execute(task.id);

        expect(detectRepeatPattern.execute).toHaveBeenCalled();
    });
});
