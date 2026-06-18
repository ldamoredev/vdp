import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateSavingsGoalCommand, CreateSavingsGoalCommandHandler } from '../../app/CreateSavingsGoalCommand';
import { identity, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('CreateSavingsGoalCommand', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('creates a savings goal', async () => {
        const goal = await new CreateSavingsGoalCommandHandler(ctx.savingsGoals)
            .handle(new CreateSavingsGoalCommand({ name: 'Emergency', targetAmount: '1000', currency: 'ARS' }), identity);

        expect(goal).toMatchObject({ name: 'Emergency', targetAmount: '1000', currentAmount: '0' });
    });
});
