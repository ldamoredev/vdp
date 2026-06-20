import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetSpendingByCategoryQuery, GetSpendingByCategoryQueryHandler } from '../../app/GetSpendingByCategoryQuery';
import {
    identity,
    makeCategory,
    makeExchangeRate,
    makeTransaction,
    setupWalletCQBusTest,
    type WalletCQBusTestContext,
} from './wallet-cqbus-test-helpers';

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

        const stats = await new GetSpendingByCategoryQueryHandler(ctx.transactions, ctx.categories, ctx.exchangeRates)
            .handle(new GetSpendingByCategoryQuery('2026-06-01', '2026-06-30'), identity);

        expect(stats).toEqual([
            expect.objectContaining({ categoryName: 'Food', currency: 'ARS', total: 150, count: 2 }),
        ]);
    });

    it('converts mixed ARS and USD category expenses to the selected summary currency using MEP by default', async () => {
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
            makeTransaction({ id: 'tx-1', categoryId: 'cat-1', type: 'expense', amount: '1000', currency: 'ARS' }),
            makeTransaction({ id: 'tx-2', categoryId: 'cat-1', type: 'expense', amount: '100', currency: 'USD' }),
        ]);

        const stats = await new GetSpendingByCategoryQueryHandler(ctx.transactions, ctx.categories, ctx.exchangeRates)
            .handle(new GetSpendingByCategoryQuery('2026-06-01', '2026-06-30'), identity);

        expect(stats).toEqual([
            expect.objectContaining({ categoryName: 'Food', currency: 'ARS', total: 101000, count: 2 }),
        ]);
        expect(stats.some((s) => s.total === 1100)).toBe(false);
    });
});
