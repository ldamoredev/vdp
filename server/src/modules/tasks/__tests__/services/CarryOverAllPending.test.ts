import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CarryOverAllPending } from '../../services/CarryOverAllPending';
import { CarryOverTask } from '../../services/CarryOverTask';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { createTask } from '../fakes/task-factory';

describe('CarryOverAllPending', () => {
    const userId = 'test-user-id';
    let repo: FakeTaskRepository;
    let service: CarryOverAllPending;
    const DATE = '2026-03-18';

    beforeEach(() => {
        repo = new FakeTaskRepository();
        const eventBus = new EventBus();
        const detectRepeatPattern = { execute: vi.fn().mockResolvedValue(undefined) } as any;
        const carryOverTask = new CarryOverTask(repo, eventBus, detectRepeatPattern);
        service = new CarryOverAllPending(repo, carryOverTask);
    });

    it('returns empty array when no pending tasks for date', async () => {
        repo.seed([createTask({ scheduledDate: DATE, status: 'done' })]);

        const result = await service.execute(userId, DATE);
        expect(result).toHaveLength(0);
    });

    it('carries over all pending tasks for the date', async () => {
        repo.seed([
            createTask({ scheduledDate: DATE, status: 'pending' }),
            createTask({ scheduledDate: DATE, status: 'pending' }),
            createTask({ scheduledDate: DATE, status: 'done' }),
        ]);

        const result = await service.execute(userId, DATE, '2026-03-19');

        expect(result).toHaveLength(2);
        result.forEach((t) => {
            expect(t.scheduledDate).toBe('2026-03-19');
            expect(t.carryOverCount).toBe(1);
        });
    });

    it('does not affect tasks from other dates', async () => {
        repo.seed([
            createTask({ scheduledDate: '2026-03-17', status: 'pending' }),
            createTask({ scheduledDate: DATE, status: 'pending' }),
        ]);

        const result = await service.execute(userId, DATE, '2026-03-19');

        expect(result).toHaveLength(1);

        // The other date's task should remain untouched
        const otherTasks = await repo.getTasksByDateAndStatus(userId, '2026-03-17', 'pending');
        expect(otherTasks).toHaveLength(1);
    });
});
