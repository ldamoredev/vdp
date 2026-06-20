import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetWalletSnapshotQuery, GetWalletSnapshotQueryHandler } from '../../app/GetWalletSnapshotQuery';
import {
    identity,
    makeCategory,
    makeExchangeRate,
    makeTransaction,
    setupWalletCQBusTest,
    type WalletCQBusTestContext,
} from './wallet-cqbus-test-helpers';

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

        const snapshot = await new GetWalletSnapshotQueryHandler(ctx.transactions, ctx.categories, ctx.exchangeRates)
            .handle(new GetWalletSnapshotQuery(), identity);

        expect(snapshot.todaySpending).toMatchObject({
            currency: 'ARS',
            totalIncome: '500.00',
            totalExpenses: '100.00',
            netBalance: '400.00',
        });
        expect(snapshot.topCategories).toEqual([
            expect.objectContaining({ categoryName: 'Food', currency: 'ARS', total: 100 }),
        ]);
    });

    it('converts mixed ARS and USD snapshot totals to the selected summary currency using MEP by default', async () => {
        ctx.categories.seed([makeCategory({ id: 'cat-1', name: 'Food', type: 'expense' })]);
        ctx.exchangeRates.seed([
            makeExchangeRate({
                id: 'rate-new',
                fromCurrency: 'USD',
                toCurrency: 'ARS',
                type: 'mep',
                rate: '1000',
                date: '2026-06-17',
            }),
        ]);
        ctx.transactions.seed([
            makeTransaction({
                id: 'tx-1',
                categoryId: 'cat-1',
                type: 'expense',
                amount: '1000',
                currency: 'ARS',
                date: '2026-06-17',
            }),
            makeTransaction({
                id: 'tx-2',
                categoryId: 'cat-1',
                type: 'expense',
                amount: '100',
                currency: 'USD',
                date: '2026-06-17',
            }),
        ]);

        const snapshot = await new GetWalletSnapshotQueryHandler(ctx.transactions, ctx.categories, ctx.exchangeRates)
            .handle(new GetWalletSnapshotQuery(), identity);

        expect(snapshot.todaySpending).toMatchObject({
            currency: 'ARS',
            totalIncome: '0.00',
            totalExpenses: '101000.00',
            netBalance: '-101000.00',
        });
        expect(snapshot.topCategories).toEqual([
            expect.objectContaining({ categoryName: 'Food', currency: 'ARS', total: 101000 }),
        ]);
        expect(snapshot.topCategories.some((category) => category.total === 1100)).toBe(false);
    });
});
