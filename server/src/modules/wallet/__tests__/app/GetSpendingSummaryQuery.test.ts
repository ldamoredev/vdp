import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetSpendingSummaryQuery, GetSpendingSummaryQueryHandler } from '../../app/GetSpendingSummaryQuery';
import { identity, makeTransaction, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('GetSpendingSummaryQuery', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('summarizes income and expenses in the selected range', async () => {
        ctx.transactions.seed([
            makeTransaction({ id: 'tx-1', type: 'income', amount: '500', date: '2026-06-17' }),
            makeTransaction({ id: 'tx-2', type: 'expense', amount: '200', date: '2026-06-17' }),
        ]);

        const summary = await new GetSpendingSummaryQueryHandler(ctx.transactions, ctx.categories)
            .handle(new GetSpendingSummaryQuery('2026-06-01', '2026-06-30'), identity);

        expect(summary).toEqual({
            totalIncome: '500.00',
            totalExpenses: '200.00',
            netBalance: '300.00',
            transactionCount: 2,
        });
    });
});
