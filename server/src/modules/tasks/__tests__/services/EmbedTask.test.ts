import { describe, it, expect, beforeEach } from 'vitest';
import { EmbedTask } from '../../services/EmbedTask';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { FakeTaskNoteRepository } from '../fakes/FakeTaskNoteRepository';
import { FakeTaskEmbeddingRepository } from '../fakes/FakeTaskEmbeddingRepository';
import { FakeEmbeddingProvider } from '../fakes/FakeEmbeddingProvider';
import { createTask } from '../fakes/task-factory';

describe('EmbedTask', () => {
    let taskRepo: FakeTaskRepository;
    let noteRepo: FakeTaskNoteRepository;
    let embeddingRepo: FakeTaskEmbeddingRepository;
    let embeddingProvider: FakeEmbeddingProvider;
    let service: EmbedTask;

    beforeEach(() => {
        taskRepo = new FakeTaskRepository();
        noteRepo = new FakeTaskNoteRepository();
        embeddingRepo = new FakeTaskEmbeddingRepository();
        embeddingProvider = new FakeEmbeddingProvider();
        service = new EmbedTask(taskRepo, noteRepo, embeddingRepo, embeddingProvider);
    });

    it('embeds a task title', async () => {
        const task = createTask({ id: 'task-1', title: 'Buy groceries' });
        taskRepo.seed([task]);

        await service.execute('task-1');

        const stored = embeddingRepo.getByTaskId('task-1');
        expect(stored).toBeDefined();
        expect(stored!.content).toBe('Buy groceries');
        expect(embeddingProvider.embedCalls).toContain('Buy groceries');
    });

    it('includes description in embedding content', async () => {
        const task = createTask({ id: 'task-1', title: 'Deploy', description: 'Push to production' });
        taskRepo.seed([task]);

        await service.execute('task-1');

        const stored = embeddingRepo.getByTaskId('task-1');
        expect(stored!.content).toBe('Deploy | Push to production');
    });

    it('includes notes in embedding content', async () => {
        const task = createTask({ id: 'task-1', title: 'Plan sprint' });
        taskRepo.seed([task]);
        await noteRepo.addNote('task-1', 'Define priorities');
        await noteRepo.addNote('task-1', 'Assign tasks');

        await service.execute('task-1');

        const stored = embeddingRepo.getByTaskId('task-1');
        expect(stored!.content).toBe('Plan sprint | Define priorities | Assign tasks');
    });

    it('does nothing when task does not exist', async () => {
        await service.execute('nonexistent');
        expect(embeddingRepo.size).toBe(0);
    });

    it('upserts (overwrites) existing embedding', async () => {
        const task = createTask({ id: 'task-1', title: 'V1' });
        taskRepo.seed([task]);
        await service.execute('task-1');

        const fetched = await taskRepo.getTask('task-1');
        fetched!.title = 'V2';
        await taskRepo.save(fetched!);
        await service.execute('task-1');

        const stored = embeddingRepo.getByTaskId('task-1');
        expect(stored!.content).toBe('V2');
    });
});
