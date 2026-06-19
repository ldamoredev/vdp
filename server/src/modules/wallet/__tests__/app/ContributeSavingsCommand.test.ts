import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContributeSavingsCommand, ContributeSavingsCommandHandler } from '../../app/ContributeSavingsCommand';
import {
    identity,
    makeSavingsGoal,
    setupWalletCQBusTest,
    type WalletCQBusTestContext,
} from './wallet-cqbus-test-helpers';

describe('ContributeSavingsCommand', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('adds a contribution to a savings goal', async () => {
        ctx.savingsGoals.seed([makeSavingsGoal({ id: 'goal-1', currentAmount: '250' })]);

        const goal = await new ContributeSavingsCommandHandler(ctx.savingsGoals, ctx.transactions)
            .handle(new ContributeSavingsCommand({ goalId: 'goal-1', amount: '100' }), identity);

        expect(goal).toMatchObject({ id: 'goal-1', currentAmount: '350.00' });
    });

    it('rejects a missing linked transaction', async () => {
        ctx.savingsGoals.seed([makeSavingsGoal({ id: 'goal-1' })]);

        await expect(new ContributeSavingsCommandHandler(ctx.savingsGoals, ctx.transactions)
            .handle(new ContributeSavingsCommand({
                goalId: 'goal-1',
                amount: '100',
                transactionId: 'missing',
            }), identity))
            .rejects.toThrow('Transaction not found');
    });
});
