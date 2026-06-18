import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetSavingsGoalsQuery, GetSavingsGoalsQueryHandler } from '../../app/GetSavingsGoalsQuery';
import { identity, makeSavingsGoal, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('GetSavingsGoalsQuery', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('lists savings goals', async () => {
        ctx.savingsGoals.seed([makeSavingsGoal({ id: 'goal-1', name: 'Emergency' })]);

        const goals = await new GetSavingsGoalsQueryHandler(ctx.savingsGoals)
            .handle(new GetSavingsGoalsQuery(), identity);

        expect(goals).toEqual([expect.objectContaining({ name: 'Emergency' })]);
    });
});
