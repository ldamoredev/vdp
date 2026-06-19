import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateInvestmentCommand, CreateInvestmentCommandHandler } from '../../app/CreateInvestmentCommand';
import { identity, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('CreateInvestmentCommand', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('creates an investment', async () => {
        const investment = await new CreateInvestmentCommandHandler(ctx.investments, ctx.accounts)
            .handle(new CreateInvestmentCommand({
                name: 'FCI',
                type: 'fci',
                currency: 'ARS',
                investedAmount: '1000',
                currentValue: '1050',
                startDate: '2026-06-01',
            }), identity);

        expect(investment).toMatchObject({ name: 'FCI', type: 'fci', currentValue: '1050' });
    });

    it('rejects investments linked to a missing account', async () => {
        await expect(new CreateInvestmentCommandHandler(ctx.investments, ctx.accounts)
            .handle(new CreateInvestmentCommand({
                name: 'FCI',
                type: 'fci',
                accountId: 'missing',
                currency: 'ARS',
                investedAmount: '1000',
                currentValue: '1050',
                startDate: '2026-06-01',
            }), identity))
            .rejects.toThrow('Account not found');
    });
});
