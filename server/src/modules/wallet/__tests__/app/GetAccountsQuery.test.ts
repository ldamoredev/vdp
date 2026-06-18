import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetAccountsQuery, GetAccountsQueryHandler } from '../../app/GetAccountsQuery';
import {
    identity,
    makeAccount,
    makeTransaction,
    setupWalletCQBusTest,
    type WalletCQBusTestContext,
} from './wallet-cqbus-test-helpers';

describe('GetAccountsQuery', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns accounts with calculated balances for the authenticated user', async () => {
        ctx.accounts.seed([makeAccount({ id: 'acc-1', initialBalance: '1000' })]);
        ctx.transactions.seed([
            makeTransaction({ id: 'tx-1', accountId: 'acc-1', type: 'income', amount: '500' }),
            makeTransaction({ id: 'tx-2', accountId: 'acc-1', type: 'expense', amount: '200' }),
        ]);

        const accounts = await new GetAccountsQueryHandler(ctx.accounts, ctx.transactions)
            .handle(new GetAccountsQuery(), identity);

        expect(accounts).toHaveLength(1);
        expect(accounts[0]).toMatchObject({ name: 'Checking', currentBalance: '1300.00' });
    });
});
