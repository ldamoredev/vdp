import { describe, it, expect, beforeEach } from 'vitest';
import { CreateTask } from '../../services/CreateTask';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { FakeTaskNoteRepository } from '../fakes/FakeTaskNoteRepository';
import { FakeTaskEmbeddingRepository } from '../fakes/FakeTaskEmbeddingRepository';
import { FakeEmbeddingProvider } from '../fakes/FakeEmbeddingProvider';
import { EmbedTask } from '../../services/EmbedTask';
import { FindSimilarTasks } from '../../services/FindSimilarTasks';

describe('CreateTask', () => {
    const userId = 'test-user-id';
    let repo: FakeTaskRepository;
    let service: CreateTask;
    let findSimilar: FindSimilarTasks;

    beforeEach(() => {
        repo = new FakeTaskRepository();
        const embeddingRepo = new FakeTaskEmbeddingRepository();
        const embeddingProvider = new FakeEmbeddingProvider();
        const embedTask = new EmbedTask(repo, new FakeTaskNoteRepository(), embeddingRepo, embeddingProvider);
        findSimilar = new FindSimilarTasks(embeddingRepo, embeddingProvider);
        service = new CreateTask(repo, embedTask, findSimilar);
    });

    it('creates a task with required fields', async () => {
        const result = await service.execute(userId, { title: 'New task' });

        expect(result.task.title).toBe('New task');
        expect(result.task.status).toBe('pending');
        expect(result.task.id).toBeDefined();
        expect(repo.size).toBe(1);
    });

    it('creates a task with all optional fields', async () => {
        const result = await service.execute(userId, {
            title: 'Full task',
            description: 'A description',
            priority: 1,
            scheduledDate: '2026-04-01',
            domain: 'work',
        });

        expect(result.task.title).toBe('Full task');
        expect(result.task.description).toBe('A description');
        expect(result.task.priority).toBe(1);
        expect(result.task.scheduledDate).toBe('2026-04-01');
        expect(result.task.domain).toBe('work');
    });

    it('returns similar tasks when checkDuplicates is true', async () => {
        // Setup: Create an existing task and its embedding
        await repo.createTask(userId, { title: 'Existing similar task' });
        // Manually setup simulation since Fakes might not automatically embed on create in this test setup
        const embeddingRepo = (service as any).findSimilarTasks.embeddingRepository;
        const provider = (service as any).findSimilarTasks.embeddingProvider;
        const embedding = await provider.embed('Existing similar task');
        await embeddingRepo.upsert(userId, 'task-1', 'Existing similar task', embedding);

        const result = await service.execute(userId, { title: 'Existing similar task' }, true);

        expect(result.similarTasks).toBeDefined();
        expect(result.similarTasks?.length).toBeGreaterThan(0);
        expect(result.similarTasks?.[0].content).toBe('Existing similar task');
    });
});
