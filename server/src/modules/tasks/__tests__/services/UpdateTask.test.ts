import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateTask } from '../../services/UpdateTask';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { FakeTaskNoteRepository } from '../fakes/FakeTaskNoteRepository';
import { FakeTaskEmbeddingRepository } from '../fakes/FakeTaskEmbeddingRepository';
import { FakeEmbeddingProvider } from '../fakes/FakeEmbeddingProvider';
import { EmbedTask } from '../../services/EmbedTask';
import { createTask } from '../fakes/task-factory';
import { DomainHttpError } from '../../../common/http/errors';

describe('UpdateTask', () => {
    let repo: FakeTaskRepository;
    let service: UpdateTask;

    beforeEach(() => {
        repo = new FakeTaskRepository();
        const embedTask = new EmbedTask(repo, new FakeTaskNoteRepository(), new FakeTaskEmbeddingRepository(), new FakeEmbeddingProvider());
        service = new UpdateTask(repo, embedTask);
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

    it('persists the changes via save', async () => {
        const task = createTask({ title: 'Before' });
        repo.seed([task]);

        await service.execute(task.id, { title: 'After' });

        const saved = await repo.getTask(task.id);
        expect(saved!.title).toBe('After');
    });

    it('rejects update on a completed task with DomainHttpError', async () => {
        const task = createTask({ status: 'done', completedAt: new Date() });
        repo.seed([task]);

        await expect(service.execute(task.id, { title: 'Nope' }))
            .rejects.toThrow(DomainHttpError);
    });

    it('rejects update on a discarded task with DomainHttpError', async () => {
        const task = createTask({ status: 'discarded' });
        repo.seed([task]);

        await expect(service.execute(task.id, { title: 'Nope' }))
            .rejects.toThrow(DomainHttpError);
    });

    it('allows rescheduling without incrementing carryOverCount', async () => {
        const task = createTask({ scheduledDate: '2026-03-22', carryOverCount: 0 });
        repo.seed([task]);

        const result = await service.execute(task.id, { scheduledDate: '2026-03-25' });

        expect(result!.scheduledDate).toBe('2026-03-25');
        expect(result!.carryOverCount).toBe(0);
    });
});
