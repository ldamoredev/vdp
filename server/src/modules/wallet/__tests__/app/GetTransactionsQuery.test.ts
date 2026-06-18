import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetTransactionsQuery, GetTransactionsQueryHandler } from '../../app/GetTransactionsQuery';
import { identity, makeTransaction, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('GetTransactionsQuery', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('lists transactions with filters', async () => {
        ctx.transactions.seed([
            makeTransaction({ id: 'tx-1', type: 'expense', description: 'Groceries' }),
            makeTransaction({ id: 'tx-2', type: 'income', description: 'Salary' }),
        ]);

        const result = await new GetTransactionsQueryHandler(ctx.transactions)
            .handle(new GetTransactionsQuery({ type: 'expense' }), identity);

        expect(result.transactions).toEqual([expect.objectContaining({ id: 'tx-1' })]);
    });
});
