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
        ]);

        const review = await new GetEndOfDayReviewQueryHandler(ctx.tasks, new RecommendationEngine())
            .handle(new GetEndOfDayReviewQuery('2026-06-17'), identity);

        expect(review).toMatchObject({ date: '2026-06-17', total: 2, completed: 1, pending: 1 });
    });
});
