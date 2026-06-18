import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetCategoryTrendsQuery, GetCategoryTrendsQueryHandler } from '../../app/GetCategoryTrendsQuery';
import { identity, makeCategory, makeTransaction, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('GetCategoryTrendsQuery', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('compares this week against last week by category', async () => {
        ctx.categories.seed([makeCategory({ id: 'cat-1', name: 'Food', type: 'expense' })]);
        ctx.transactions.seed([
            makeTransaction({ id: 'current', categoryId: 'cat-1', amount: '300', date: '2026-06-17' }),
            makeTransaction({ id: 'past', categoryId: 'cat-1', amount: '100', date: '2026-06-10' }),
        ]);

        const trends = await new GetCategoryTrendsQueryHandler(ctx.transactions, ctx.categories)
            .handle(new GetCategoryTrendsQuery(), identity);

        expect(trends).toEqual([expect.objectContaining({ category: 'Food', trend: 'up' })]);
    });
});
