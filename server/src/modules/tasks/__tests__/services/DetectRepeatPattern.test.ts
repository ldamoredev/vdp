import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DetectRepeatPattern } from '../../services/DetectRepeatPattern';
import { FindSimilarTasks } from '../../services/FindSimilarTasks';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { FakeTaskEmbeddingRepository } from '../fakes/FakeTaskEmbeddingRepository';
import { FakeEmbeddingProvider } from '../fakes/FakeEmbeddingProvider';
import { EventBus } from '../../../common/base/event-bus/EventBus';

describe('DetectRepeatPattern', () => {
    let service: DetectRepeatPattern;
    let repo: FakeTaskRepository;
    let eventBus: EventBus;
    let findSimilar: FindSimilarTasks;

    beforeEach(() => {
        repo = new FakeTaskRepository();
        eventBus = new EventBus();
        const embeddingRepo = new FakeTaskEmbeddingRepository();
        const embeddingProvider = new FakeEmbeddingProvider();
        findSimilar = new FindSimilarTasks(embeddingRepo, embeddingProvider);
        service = new DetectRepeatPattern(findSimilar, repo, eventBus);
        
        vi.spyOn(eventBus, 'emit');
    });

    it('emits habitual_discard when multiple previous tasks were discarded', async () => {
        // Setup history
        const t1 = await repo.createTask({ title: 'Exercise' });
        t1.discard();
        await repo.save(t1);
        
        const t2 = await repo.createTask({ title: 'Exercise' });
        t2.discard();
        await repo.save(t2);

        // Mock embedding for similarity
        const embeddingRepo = (findSimilar as any).embeddingRepository;
        const provider = (findSimilar as any).embeddingProvider;
        const embedding = await provider.embed('Exercise');
        await embeddingRepo.upsert(t1.id, 'Exercise', embedding);
        await embeddingRepo.upsert(t2.id, 'Exercise', embedding);

        const currentTask = await repo.createTask({ title: 'Exercise' });
        
        await service.execute(currentTask);

        expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
            type: 'task.repeat_detected',
            payload: expect.objectContaining({
                pattern: 'habitual_discard'
            })
        }));
    });

    it('emits frequent_recreation when multiple previous tasks were completed', async () => {
        // Setup history
        for (let i = 0; i < 3; i++) {
            const t = await repo.createTask({ title: 'Meditate' });
            t.complete();
            await repo.save(t);
            
            const embeddingRepo = (findSimilar as any).embeddingRepository;
            const provider = (findSimilar as any).embeddingProvider;
            const embedding = await provider.embed('Meditate');
            await embeddingRepo.upsert(t.id, 'Meditate', embedding);
        }

        const currentTask = await repo.createTask({ title: 'Meditate' });
        
        await service.execute(currentTask);

        expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
            type: 'task.repeat_detected',
            payload: expect.objectContaining({
                pattern: 'frequent_recreation'
            })
        }));
    });

    it('does nothing if no repeat pattern is found', async () => {
        const currentTask = await repo.createTask({ title: 'Unique task' });
        await service.execute(currentTask);
        expect(eventBus.emit).not.toHaveBeenCalled();
    });
});
