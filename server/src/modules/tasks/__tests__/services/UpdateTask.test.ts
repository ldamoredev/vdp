import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateTask } from '../../services/UpdateTask';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { createTask } from '../fakes/task-factory';

describe('UpdateTask', () => {
    let repo: FakeTaskRepository;
    let service: UpdateTask;

    beforeEach(() => {
        repo = new FakeTaskRepository();
        service = new UpdateTask(repo);
    });

    it('returns null when task does not exist', async () => {
        const result = await service.execute('nonexistent', { title: 'New' });
        expect(result).toBeNull();
    });

    it('updates title only', async () => {
        const task = createTask({ title: 'Old title' });
        repo.seed([task]);

        const result = await service.execute(task.id, { title: 'New title' });

        expect(result!.title).toBe('New title');
    });

    it('updates multiple fields at once', async () => {
        const task = createTask({ title: 'Original', priority: 3 });
        repo.seed([task]);

        const result = await service.execute(task.id, {
            title: 'Updated',
            priority: 1,
            domain: 'health',
        });

        expect(result!.title).toBe('Updated');
        expect(result!.priority).toBe(1);
        expect(result!.domain).toBe('health');
    });

    it('persists the changes', async () => {
        const task = createTask({ title: 'Before' });
        repo.seed([task]);

        await service.execute(task.id, { title: 'After' });

        const saved = await repo.getTask(task.id);
        expect(saved!.title).toBe('After');
    });
});
