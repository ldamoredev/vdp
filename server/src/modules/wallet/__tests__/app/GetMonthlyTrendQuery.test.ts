import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetMonthlyTrendQuery, GetMonthlyTrendQueryHandler } from '../../app/GetMonthlyTrendQuery';
import {
    identity,
    makeExchangeRate,
    makeTransaction,
    setupWalletCQBusTest,
    type WalletCQBusTestContext,
} from './wallet-cqbus-test-helpers';

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

        const trend = await new GetMonthlyTrendQueryHandler(ctx.transactions, ctx.exchangeRates)
            .handle(new GetMonthlyTrendQuery(2026), identity);

        expect(trend).toEqual([{ month: '2026-06', currency: 'ARS', income: 500, expense: 200 }]);
    });

    it('converts mixed ARS and USD monthly totals to the selected summary currency using MEP by default', async () => {
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
            makeTransaction({ id: 'tx-1', type: 'income', amount: '1000', currency: 'ARS', date: '2026-06-01' }),
            makeTransaction({ id: 'tx-2', type: 'income', amount: '100', currency: 'USD', date: '2026-06-02' }),
            makeTransaction({ id: 'tx-3', type: 'expense', amount: '500', currency: 'ARS', date: '2026-06-03' }),
            makeTransaction({ id: 'tx-4', type: 'expense', amount: '10', currency: 'USD', date: '2026-06-04' }),
        ]);

        const trend = await new GetMonthlyTrendQueryHandler(ctx.transactions, ctx.exchangeRates)
            .handle(new GetMonthlyTrendQuery(2026), identity);

        expect(trend).toEqual([
            {
                month: '2026-06',
                currency: 'ARS',
                income: 101000,
                expense: 10500,
            },
        ]);
    });
});
