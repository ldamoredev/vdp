import { describe, it, expect, beforeEach } from 'vitest';
import { DiscardTask } from '../../services/DiscardTask';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { createTask } from '../fakes/task-factory';

describe('DiscardTask', () => {
    let repo: FakeTaskRepository;
    let service: DiscardTask;

    beforeEach(() => {
        repo = new FakeTaskRepository();
        service = new DiscardTask(repo);
    });

    it('returns null when task does not exist', async () => {
        const result = await service.execute('nonexistent');
        expect(result).toBeNull();
    });

    it('discards the task and saves', async () => {
        const task = createTask({ status: 'pending' });
        repo.seed([task]);

        const result = await service.execute(task.id);

        expect(result!.status).toBe('discarded');

        const saved = await repo.getTask(task.id);
        expect(saved!.status).toBe('discarded');
    });
});
