import { describe, it, expect, beforeEach } from 'vitest';
import { GetEndOfDayReview } from '../../services/GetEndOfDayReview';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { createTask } from '../fakes/task-factory';

describe('GetEndOfDayReview', () => {
    let repo: FakeTaskRepository;
    let service: GetEndOfDayReview;
    const DATE = '2026-03-18';

    beforeEach(() => {
        repo = new FakeTaskRepository();
        service = new GetEndOfDayReview(repo);
    });

    it('returns zeroed review when no tasks', async () => {
        const review = await service.execute(DATE);

        expect(review.date).toBe(DATE);
        expect(review.total).toBe(0);
        expect(review.completed).toBe(0);
        expect(review.pending).toBe(0);
        expect(review.completionRate).toBe(0);
        expect(review.pendingTasks).toHaveLength(0);
        expect(review.allTasks).toHaveLength(0);
    });

    it('computes stats correctly for mixed statuses', async () => {
        repo.seed([
            createTask({ scheduledDate: DATE, status: 'done' }),
            createTask({ scheduledDate: DATE, status: 'done' }),
            createTask({ scheduledDate: DATE, status: 'pending' }),
            createTask({ scheduledDate: DATE, status: 'discarded' }),
        ]);

        const review = await service.execute(DATE);

        expect(review.total).toBe(4);
        expect(review.completed).toBe(2);
        expect(review.pending).toBe(1);
        expect(review.discarded).toBe(1);
        expect(review.completionRate).toBe(50);
    });

    it('returns pendingTasks as Task instances', async () => {
        repo.seed([
            createTask({ scheduledDate: DATE, status: 'pending', title: 'Still pending' }),
            createTask({ scheduledDate: DATE, status: 'done' }),
        ]);

        const review = await service.execute(DATE);

        expect(review.pendingTasks).toHaveLength(1);
        expect(review.pendingTasks[0].title).toBe('Still pending');
    });

    it('defaults to today when no date given', async () => {
        const today = new Date().toISOString().slice(0, 10);
        repo.seed([createTask({ scheduledDate: today, status: 'done' })]);

        const review = await service.execute();

        expect(review.date).toBe(today);
        expect(review.total).toBe(1);
    });
});
