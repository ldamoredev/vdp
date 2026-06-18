import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetExchangeRatesQuery, GetExchangeRatesQueryHandler } from '../../app/GetExchangeRatesQuery';
import { makeExchangeRate, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('GetExchangeRatesQuery', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns the latest exchange rate per pair and type', async () => {
        ctx.exchangeRates.seed([
            makeExchangeRate({ id: 'old', type: 'blue', rate: '1000.00', date: '2026-06-16' }),
            makeExchangeRate({ id: 'new', type: 'blue', rate: '1100.00', date: '2026-06-17' }),
        ]);

        const rates = await new GetExchangeRatesQueryHandler(ctx.exchangeRates)
            .handle(new GetExchangeRatesQuery());

        expect(rates).toEqual([expect.objectContaining({ id: 'new', rate: '1100.00' })]);
    });
});
