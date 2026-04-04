import { describe, it, expect, beforeEach } from 'vitest';
import { FindSimilarTasks } from '../../services/FindSimilarTasks';
import { FakeTaskEmbeddingRepository } from '../fakes/FakeTaskEmbeddingRepository';
import { FakeEmbeddingProvider } from '../fakes/FakeEmbeddingProvider';

describe('FindSimilarTasks', () => {
    const userId = 'test-user-id';
    let embeddingRepo: FakeTaskEmbeddingRepository;
    let embeddingProvider: FakeEmbeddingProvider;
    let service: FindSimilarTasks;

    beforeEach(() => {
        embeddingRepo = new FakeTaskEmbeddingRepository();
        embeddingProvider = new FakeEmbeddingProvider(3);
        service = new FindSimilarTasks(embeddingRepo, embeddingProvider);
    });

    it('returns empty array when no embeddings exist', async () => {
        const results = await service.execute(userId, 'anything');
        expect(results).toEqual([]);
    });

    it('finds similar tasks with matchPercent', async () => {
        const vector = [0.1, 0.1, 0.1];
        embeddingRepo.seed('task-1', 'Buy groceries', vector);
        embeddingRepo.seed('task-2', 'Clean the house', vector);

        const results = await service.execute(userId, 'Buy food');

        expect(results.length).toBeGreaterThan(0);
        for (const r of results) {
            expect(r.matchPercent).toBeGreaterThanOrEqual(0);
            expect(r.matchPercent).toBeLessThanOrEqual(100);
            expect(r.taskId).toBeDefined();
            expect(r.content).toBeDefined();
        }
    });

    it('respects limit parameter', async () => {
        const vector = [0.1, 0.1, 0.1];
        embeddingRepo.seed('task-1', 'Task A', vector);
        embeddingRepo.seed('task-2', 'Task B', vector);
        embeddingRepo.seed('task-3', 'Task C', vector);

        const results = await service.execute(userId, 'query', 2);

        expect(results.length).toBeLessThanOrEqual(2);
    });
});
