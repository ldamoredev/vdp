import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FindSimilarTasksQuery, FindSimilarTasksQueryHandler } from '../../app/FindSimilarTasksQuery';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext } from './task-cqbus-test-helpers';

describe('FindSimilarTasksQuery', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('finds similar embedded tasks for the authenticated user', async () => {
        ctx.embeddings.seed('task-1', 'Write report', [0.1, 0.1, 0.1]);

        const results = await new FindSimilarTasksQueryHandler(ctx.embeddings, ctx.embeddingProvider)
            .handle(new FindSimilarTasksQuery('report', 5, 0.7), identity);

        expect(results).toEqual([
            expect.objectContaining({
                taskId: 'task-1',
                content: 'Write report',
                matchPercent: 100,
            }),
        ]);
        expect(results[0].similarity).toBeCloseTo(1);
    });
});
