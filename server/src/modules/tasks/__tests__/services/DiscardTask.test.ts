import { describe, it, expect, beforeEach } from 'vitest';
import { DiscardTask } from '../../services/DiscardTask';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { createTask } from '../fakes/task-factory';
import { DomainHttpError } from '../../../common/http/errors';

describe('DiscardTask', () => {
    const userId = 'test-user-id';
    let repo: FakeTaskRepository;
    let service: DiscardTask;

    beforeEach(() => {
        repo = new FakeTaskRepository();
        service = new DiscardTask(repo);
    });

    it('returns null when task does not exist', async () => {
        const result = await service.execute(userId, 'nonexistent');
        expect(result).toBeNull();
    });

    it('rejects discarding a done task', async () => {
        const task = createTask({ status: 'done', completedAt: new Date() });
        repo.seed([task]);

        await expect(service.execute(userId, task.id)).rejects.toThrow(DomainHttpError);
    });

    it('rejects discarding an already discarded task', async () => {
        const task = createTask({ status: 'discarded' });
        repo.seed([task]);

        await expect(service.execute(userId, task.id)).rejects.toThrow(DomainHttpError);
    });

    it('discards the task and saves', async () => {
        const task = createTask({ status: 'pending' });
        repo.seed([task]);

        const result = await service.execute(userId, task.id);

        expect(result!.status).toBe('discarded');

        const saved = await repo.getTask(userId, task.id);
        expect(saved!.status).toBe('discarded');
    });
});
