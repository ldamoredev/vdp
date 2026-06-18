import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateExchangeRateCommand, CreateExchangeRateCommandHandler } from '../../app/CreateExchangeRateCommand';
import { setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('CreateExchangeRateCommand', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('creates an exchange rate and defaults the date to today', async () => {
        const rate = await new CreateExchangeRateCommandHandler(ctx.exchangeRates)
            .handle(new CreateExchangeRateCommand({
                fromCurrency: 'USD',
                toCurrency: 'ARS',
                rate: '1100.00',
                type: 'blue',
            }));

        expect(rate).toMatchObject({ rate: '1100.00', type: 'blue', date: '2026-06-17' });
    });
});
