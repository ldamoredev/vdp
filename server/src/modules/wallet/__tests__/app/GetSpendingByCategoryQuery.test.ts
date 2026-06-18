import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetSpendingByCategoryQuery, GetSpendingByCategoryQueryHandler } from '../../app/GetSpendingByCategoryQuery';
import { identity, makeCategory, makeTransaction, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('GetSpendingByCategoryQuery', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('groups expense totals by category', async () => {
        ctx.categories.seed([makeCategory({ id: 'cat-1', name: 'Food', type: 'expense' })]);
        ctx.transactions.seed([
            makeTransaction({ id: 'tx-1', categoryId: 'cat-1', type: 'expense', amount: '100' }),
            makeTransaction({ id: 'tx-2', categoryId: 'cat-1', type: 'expense', amount: '50' }),
        ]);

        const stats = await new GetSpendingByCategoryQueryHandler(ctx.transactions, ctx.categories)
            .handle(new GetSpendingByCategoryQuery('2026-06-01', '2026-06-30'), identity);

        expect(stats).toEqual([expect.objectContaining({ categoryName: 'Food', total: 150, count: 2 })]);
    });
});
