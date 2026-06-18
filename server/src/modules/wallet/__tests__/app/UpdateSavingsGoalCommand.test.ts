import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UpdateSavingsGoalCommand, UpdateSavingsGoalCommandHandler } from '../../app/UpdateSavingsGoalCommand';
import { identity, makeSavingsGoal, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('UpdateSavingsGoalCommand', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('updates a savings goal', async () => {
        ctx.savingsGoals.seed([makeSavingsGoal({ id: 'goal-1', name: 'Old' })]);

        const goal = await new UpdateSavingsGoalCommandHandler(ctx.savingsGoals)
            .handle(new UpdateSavingsGoalCommand('goal-1', { name: 'New' }), identity);

        expect(goal).toMatchObject({ id: 'goal-1', name: 'New' });
    });
});
