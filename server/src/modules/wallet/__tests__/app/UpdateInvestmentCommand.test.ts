import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UpdateInvestmentCommand, UpdateInvestmentCommandHandler } from '../../app/UpdateInvestmentCommand';
import { identity, makeInvestment, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('UpdateInvestmentCommand', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('updates an investment', async () => {
        ctx.investments.seed([makeInvestment({ id: 'inv-1', currentValue: '1050' })]);

        const investment = await new UpdateInvestmentCommandHandler(ctx.investments, ctx.accounts)
            .handle(new UpdateInvestmentCommand('inv-1', { currentValue: '1100' }), identity);

        expect(investment).toMatchObject({ id: 'inv-1', currentValue: '1100' });
    });
});
