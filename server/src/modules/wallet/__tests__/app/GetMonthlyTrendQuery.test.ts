import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetMonthlyTrendQuery, GetMonthlyTrendQueryHandler } from '../../app/GetMonthlyTrendQuery';
import { identity, makeTransaction, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('GetMonthlyTrendQuery', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns monthly income and expense points', async () => {
        ctx.transactions.seed([
            makeTransaction({ id: 'tx-1', type: 'income', amount: '500', date: '2026-06-01' }),
            makeTransaction({ id: 'tx-2', type: 'expense', amount: '200', date: '2026-06-02' }),
        ]);

        const trend = await new GetMonthlyTrendQueryHandler(ctx.transactions, ctx.categories)
            .handle(new GetMonthlyTrendQuery(2026), identity);

        expect(trend).toEqual([{ month: '2026-06', income: 500, expense: 200 }]);
    });
});
