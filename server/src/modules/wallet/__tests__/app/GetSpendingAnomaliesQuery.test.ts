import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetSpendingAnomaliesQuery, GetSpendingAnomaliesQueryHandler } from '../../app/GetSpendingAnomaliesQuery';
import { identity, makeCategory, makeTransaction, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('GetSpendingAnomaliesQuery', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns unusual spending categories', async () => {
        ctx.categories.seed([makeCategory({ id: 'cat-1', name: 'Food', type: 'expense' })]);
        ctx.transactions.seed([
            makeTransaction({ id: 'current', categoryId: 'cat-1', amount: '300', date: '2026-06-17' }),
            makeTransaction({ id: 'past', categoryId: 'cat-1', amount: '100', date: '2026-06-10' }),
        ]);

        const anomalies = await new GetSpendingAnomaliesQueryHandler(ctx.transactions, ctx.categories)
            .handle(new GetSpendingAnomaliesQuery(), identity);

        expect(anomalies).toEqual([expect.objectContaining({ category: 'Food', direction: 'up' })]);
    });
});
