import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RefreshExchangeRatesCommand, RefreshExchangeRatesCommandHandler } from '../../app/RefreshExchangeRatesCommand';
import { ExchangeRateProvider, FetchedExchangeRate } from '../../domain/ExchangeRateProvider';
import { identity, makeExchangeRate, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

class FakeExchangeRateProvider extends ExchangeRateProvider {
    constructor(private readonly rates: FetchedExchangeRate[]) {
        super();
    }

    async fetchDollarRates(): Promise<FetchedExchangeRate[]> {
        return this.rates;
    }
}

describe('RefreshExchangeRatesCommand', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('fetches dollar rates from the provider and persists them', async () => {
        const provider = new FakeExchangeRateProvider([
            { fromCurrency: 'USD', toCurrency: 'ARS', rate: '1250.00', type: 'mep', date: '2026-06-17' },
            { fromCurrency: 'USD', toCurrency: 'ARS', rate: '1300.00', type: 'blue', date: '2026-06-17' },
        ]);

        const saved = await new RefreshExchangeRatesCommandHandler(provider, ctx.exchangeRates)
            .handle(new RefreshExchangeRatesCommand(), identity);

        expect(saved).toHaveLength(2);
        const stored = await ctx.exchangeRates.findAll();
        expect(stored.map((r) => r.type).sort()).toEqual(['blue', 'mep']);
        expect(stored.find((r) => r.type === 'mep')).toMatchObject({
            fromCurrency: 'USD',
            toCurrency: 'ARS',
            rate: '1250.00',
            type: 'mep',
        });
    });

    it('upserts the same-day rate instead of duplicating it', async () => {
        ctx.exchangeRates.seed([
            makeExchangeRate({ id: 'fx-old', type: 'mep', rate: '1000.00', date: '2026-06-17' }),
        ]);
        const provider = new FakeExchangeRateProvider([
            { fromCurrency: 'USD', toCurrency: 'ARS', rate: '1250.00', type: 'mep', date: '2026-06-17' },
        ]);

        await new RefreshExchangeRatesCommandHandler(provider, ctx.exchangeRates)
            .handle(new RefreshExchangeRatesCommand(), identity);

        const mepToday = (await ctx.exchangeRates.findAll()).filter(
            (r) => r.type === 'mep' && r.date === '2026-06-17',
        );
        expect(mepToday).toHaveLength(1);
        expect(mepToday[0].rate).toBe('1250.00');
    });
});
