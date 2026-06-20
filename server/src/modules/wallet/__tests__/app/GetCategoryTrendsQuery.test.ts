import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetCategoryTrendsQuery, GetCategoryTrendsQueryHandler } from '../../app/GetCategoryTrendsQuery';
import {
    identity,
    makeCategory,
    makeExchangeRate,
    makeTransaction,
    setupWalletCQBusTest,
    type WalletCQBusTestContext,
} from './wallet-cqbus-test-helpers';

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

        const trends = await new GetCategoryTrendsQueryHandler(ctx.transactions, ctx.categories, ctx.exchangeRates)
            .handle(new GetCategoryTrendsQuery(), identity);

        expect(trends).toEqual([expect.objectContaining({ category: 'Food', currency: 'ARS', trend: 'up' })]);
    });

    it('converts mixed ARS and USD category trends to the selected summary currency using MEP by default', async () => {
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
            makeTransaction({ id: 'current-ars', categoryId: 'cat-1', amount: '1000', currency: 'ARS', date: '2026-06-17' }),
            makeTransaction({ id: 'current-usd', categoryId: 'cat-1', amount: '100', currency: 'USD', date: '2026-06-17' }),
        ]);

        const trends = await new GetCategoryTrendsQueryHandler(ctx.transactions, ctx.categories, ctx.exchangeRates)
            .handle(new GetCategoryTrendsQuery(), identity);

        expect(trends).toEqual([
            expect.objectContaining({
                category: 'Food',
                currency: 'ARS',
                thisWeek: 101000,
                lastWeek: 0,
                trend: 'up',
            }),
        ]);
    });
});
