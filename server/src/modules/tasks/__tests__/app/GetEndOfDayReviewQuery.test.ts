import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetEndOfDayReviewQuery, GetEndOfDayReviewQueryHandler } from '../../app/GetEndOfDayReviewQuery';
import { RecommendationEngine } from '../../services/RecommendationEngine';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext } from './task-cqbus-test-helpers';

describe('GetEndOfDayReviewQuery', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns the end of day review for the authenticated user', async () => {
        ctx.tasks.seed([
            createTask({ id: 'task-1', scheduledDate: '2026-06-17', status: 'done' }),
            createTask({ id: 'task-2', scheduledDate: '2026-06-17', status: 'pending' }),
            createTask({ id: 'task-3', scheduledDate: '2026-06-17', status: 'in_progress' }),
        ]);

        const review = await new GetEndOfDayReviewQueryHandler(ctx.tasks, new RecommendationEngine())
            .handle(new GetEndOfDayReviewQuery('2026-06-17'), identity);

        expect(review).toMatchObject({ date: '2026-06-17', total: 3, completed: 1, pending: 2 });
        expect(review.pendingTasks.map((task) => task.id)).toEqual(['task-2', 'task-3']);
    });

    it('includes tasks completed on the review date even when scheduled earlier', async () => {
        ctx.tasks.seed([
            createTask({
                id: 'completed-today',
                scheduledDate: '2026-06-16',
                status: 'done',
                completedAt: new Date('2026-06-17T11:00:00.000Z'),
            }),
            createTask({ id: 'pending-today', scheduledDate: '2026-06-17', status: 'pending' }),
        ]);

        const review = await new GetEndOfDayReviewQueryHandler(ctx.tasks, new RecommendationEngine())
            .handle(new GetEndOfDayReviewQuery('2026-06-17'), identity);

        expect(review).toMatchObject({ total: 2, completed: 1, pending: 1 });
        expect(review.allTasks.map((task) => task.id)).toEqual([
            'pending-today',
            'completed-today',
        ]);
    });
});
