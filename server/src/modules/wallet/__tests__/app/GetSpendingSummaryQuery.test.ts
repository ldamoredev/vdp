import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetSpendingSummaryQuery, GetSpendingSummaryQueryHandler } from '../../app/GetSpendingSummaryQuery';
import {
    identity,
    makeExchangeRate,
    makeTransaction,
    setupWalletCQBusTest,
    type WalletCQBusTestContext,
} from './wallet-cqbus-test-helpers';

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

        const summary = await new GetSpendingSummaryQueryHandler(ctx.transactions, ctx.exchangeRates)
            .handle(new GetSpendingSummaryQuery('2026-06-01', '2026-06-30'), identity);

        expect(summary).toMatchObject({
            currency: 'ARS',
            totalIncome: '500.00',
            totalExpenses: '200.00',
            netBalance: '300.00',
            transactionCount: 2,
            conversion: { rateType: 'mep', rates: [] },
        });
    });

    it('converts mixed ARS and USD transactions to the selected summary currency using MEP by default', async () => {
        ctx.exchangeRates.seed([
            makeExchangeRate({
                id: 'rate-old',
                fromCurrency: 'USD',
                toCurrency: 'ARS',
                type: 'mep',
                rate: '900',
                date: '2026-06-16',
            }),
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
            makeTransaction({ id: 'tx-1', type: 'income', amount: '1000', currency: 'ARS', date: '2026-06-17' }),
            makeTransaction({ id: 'tx-2', type: 'income', amount: '100', currency: 'USD', date: '2026-06-17' }),
            makeTransaction({ id: 'tx-3', type: 'expense', amount: '500', currency: 'ARS', date: '2026-06-17' }),
            makeTransaction({ id: 'tx-4', type: 'expense', amount: '10', currency: 'USD', date: '2026-06-17' }),
        ]);

        const summary = await new GetSpendingSummaryQueryHandler(ctx.transactions, ctx.exchangeRates)
            .handle(new GetSpendingSummaryQuery('2026-06-01', '2026-06-30'), identity);

        expect(summary).toEqual({
            currency: 'ARS',
            totalIncome: '101000.00',
            totalExpenses: '10500.00',
            netBalance: '90500.00',
            transactionCount: 4,
            conversion: {
                rateType: 'mep',
                rates: [
                    {
                        fromCurrency: 'USD',
                        toCurrency: 'ARS',
                        rate: '1000.00000000',
                        date: '2026-06-17',
                    },
                ],
            },
        });
    });
});
