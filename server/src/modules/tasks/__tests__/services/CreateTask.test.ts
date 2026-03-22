import { describe, it, expect, beforeEach } from 'vitest';
import { CreateTask } from '../../services/CreateTask';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { FakeTaskNoteRepository } from '../fakes/FakeTaskNoteRepository';
import { FakeTaskEmbeddingRepository } from '../fakes/FakeTaskEmbeddingRepository';
import { FakeEmbeddingProvider } from '../fakes/FakeEmbeddingProvider';
import { EmbedTask } from '../../services/EmbedTask';

describe('CreateTask', () => {
    let repo: FakeTaskRepository;
    let service: CreateTask;

    beforeEach(() => {
        repo = new FakeTaskRepository();
        const embedTask = new EmbedTask(repo, new FakeTaskNoteRepository(), new FakeTaskEmbeddingRepository(), new FakeEmbeddingProvider());
        service = new CreateTask(repo, embedTask);
    });

    it('creates a task with required fields', async () => {
        const result = await service.execute({ title: 'New task' });

        expect(result.title).toBe('New task');
        expect(result.status).toBe('pending');
        expect(result.id).toBeDefined();
        expect(repo.size).toBe(1);
    });

    it('creates a task with all optional fields', async () => {
        const result = await service.execute({
            title: 'Full task',
            description: 'A description',
            priority: 1,
            scheduledDate: '2026-04-01',
            domain: 'work',
        });

        expect(result.title).toBe('Full task');
        expect(result.description).toBe('A description');
        expect(result.priority).toBe(1);
        expect(result.scheduledDate).toBe('2026-04-01');
        expect(result.domain).toBe('work');
    });

    it('defaults priority to 2 and domain to null', async () => {
        const result = await service.execute({ title: 'Defaults' });

        expect(result.priority).toBe(2);
        expect(result.domain).toBeNull();
    });
});
