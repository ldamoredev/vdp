import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetWalletSnapshotQuery, GetWalletSnapshotQueryHandler } from '../../app/GetWalletSnapshotQuery';
import { identity, makeCategory, makeTransaction, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('GetWalletSnapshotQuery', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns today spending and top categories', async () => {
        ctx.categories.seed([makeCategory({ id: 'cat-1', name: 'Food', type: 'expense' })]);
        ctx.transactions.seed([
            makeTransaction({ id: 'tx-1', categoryId: 'cat-1', type: 'expense', amount: '100', date: '2026-06-17' }),
            makeTransaction({ id: 'tx-2', type: 'income', amount: '500', date: '2026-06-17' }),
        ]);

        const snapshot = await new GetWalletSnapshotQueryHandler(ctx.transactions, ctx.categories)
            .handle(new GetWalletSnapshotQuery(), identity);

        expect(snapshot.todaySpending).toMatchObject({
            totalIncome: '500.00',
            totalExpenses: '100.00',
            netBalance: '400.00',
        });
        expect(snapshot.topCategories).toEqual([expect.objectContaining({ categoryName: 'Food', total: 100 })]);
    });
});
