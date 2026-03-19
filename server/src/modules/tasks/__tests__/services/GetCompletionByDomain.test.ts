import { describe, it, expect, beforeEach } from 'vitest';
import { GetCompletionByDomain } from '../../services/GetCompletionByDomain';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { createTask } from '../fakes/task-factory';

describe('GetCompletionByDomain', () => {
    let repo: FakeTaskRepository;
    let service: GetCompletionByDomain;

    beforeEach(() => {
        repo = new FakeTaskRepository();
        service = new GetCompletionByDomain(repo);
    });

    it('returns empty array when no completed tasks', async () => {
        repo.seed([createTask({ status: 'pending', domain: 'work' })]);

        const result = await service.execute();
        expect(result).toHaveLength(0);
    });

    it('groups completed tasks by domain', async () => {
        repo.seed([
            createTask({ status: 'done', domain: 'work' }),
            createTask({ status: 'done', domain: 'work' }),
            createTask({ status: 'done', domain: 'health' }),
            createTask({ status: 'pending', domain: 'work' }),
        ]);

        const result = await service.execute();

        const workStat = result.find((s) => s.domain === 'work');
        const healthStat = result.find((s) => s.domain === 'health');

        expect(workStat?.count).toBe(2);
        expect(healthStat?.count).toBe(1);
    });

    it('filters by date range', async () => {
        repo.seed([
            createTask({ status: 'done', domain: 'work', scheduledDate: '2026-03-10' }),
            createTask({ status: 'done', domain: 'work', scheduledDate: '2026-03-18' }),
            createTask({ status: 'done', domain: 'work', scheduledDate: '2026-03-25' }),
        ]);

        const result = await service.execute('2026-03-15', '2026-03-20');

        expect(result).toHaveLength(1);
        expect(result[0].count).toBe(1);
    });
});
