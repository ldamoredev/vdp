import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetSpendingAnomaliesQuery, GetSpendingAnomaliesQueryHandler } from '../../app/GetSpendingAnomaliesQuery';
import {
    identity,
    makeCategory,
    makeExchangeRate,
    makeTransaction,
    setupWalletCQBusTest,
    type WalletCQBusTestContext,
} from './wallet-cqbus-test-helpers';

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

        const anomalies = await new GetSpendingAnomaliesQueryHandler(ctx.transactions, ctx.categories, ctx.exchangeRates)
            .handle(new GetSpendingAnomaliesQuery(), identity);

        expect(anomalies).toEqual([expect.objectContaining({ category: 'Food', currency: 'ARS', direction: 'up' })]);
    });

    it('converts mixed ARS and USD anomaly totals to the selected summary currency using MEP by default', async () => {
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
            makeTransaction({ id: 'past', categoryId: 'cat-1', amount: '1000', currency: 'ARS', date: '2026-06-10' }),
        ]);

        const anomalies = await new GetSpendingAnomaliesQueryHandler(ctx.transactions, ctx.categories, ctx.exchangeRates)
            .handle(new GetSpendingAnomaliesQuery(), identity);

        expect(anomalies).toEqual([
            expect.objectContaining({
                category: 'Food',
                currency: 'ARS',
                currentWeek: 101000,
                average: 1000,
                direction: 'up',
            }),
        ]);
        expect(anomalies.some((anomaly) => anomaly.currentWeek === 1100)).toBe(false);
    });
});
