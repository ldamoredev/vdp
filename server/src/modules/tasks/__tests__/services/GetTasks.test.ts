import { describe, it, expect, beforeEach } from 'vitest';
import { GetTasks } from '../../services/GetTasks';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { createTask } from '../fakes/task-factory';

describe('GetTasks', () => {
    const userId = 'test-user-id';
    let repo: FakeTaskRepository;
    let service: GetTasks;

    beforeEach(() => {
        repo = new FakeTaskRepository();
        service = new GetTasks(repo);
    });

    it('returns empty list when no tasks exist', async () => {
        const result = await service.execute(userId, {});
        expect(result.tasks).toHaveLength(0);
        expect(result.total).toBe(0);
    });

    it('returns all tasks without filters', async () => {
        repo.seed([createTask(), createTask(), createTask()]);

        const result = await service.execute(userId, {});
        expect(result.tasks).toHaveLength(3);
        expect(result.total).toBe(3);
    });

    it('filters by scheduledDate', async () => {
        repo.seed([
            createTask({ scheduledDate: '2026-03-18' }),
            createTask({ scheduledDate: '2026-03-19' }),
        ]);

        const result = await service.execute(userId, { scheduledDate: '2026-03-18' });
        expect(result.tasks).toHaveLength(1);
        expect(result.tasks[0].scheduledDate).toBe('2026-03-18');
    });

    it('filters by status', async () => {
        repo.seed([
            createTask({ status: 'pending' }),
            createTask({ status: 'done' }),
            createTask({ status: 'pending' }),
        ]);

        const result = await service.execute(userId, { status: 'done' });
        expect(result.tasks).toHaveLength(1);
    });

    it('applies limit and offset', async () => {
        repo.seed(Array.from({ length: 5 }, () => createTask()));

        const result = await service.execute(userId, { limit: 2, offset: 1 });
        expect(result.tasks).toHaveLength(2);
        expect(result.total).toBe(5);
        expect(result.limit).toBe(2);
        expect(result.offset).toBe(1);
    });
});
