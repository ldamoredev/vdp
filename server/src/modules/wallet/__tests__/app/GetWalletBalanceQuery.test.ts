import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetWalletBalanceQuery, GetWalletBalanceQueryHandler } from '../../app/GetWalletBalanceQuery';
import { identity, makeAccount, makeTransaction, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('GetWalletBalanceQuery', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('groups totals by currency without summing across currencies', async () => {
        ctx.accounts.seed([
            makeAccount({ id: 'ars', currency: 'ARS', initialBalance: '100' }),
            makeAccount({ id: 'usd', currency: 'USD', initialBalance: '10' }),
        ]);
        ctx.transactions.seed([
            makeTransaction({ id: 'tx-1', accountId: 'ars', type: 'income', amount: '50', currency: 'ARS' }),
            makeTransaction({ id: 'tx-2', accountId: 'usd', type: 'income', amount: '5', currency: 'USD' }),
        ]);

        const balance = await new GetWalletBalanceQueryHandler(ctx.accounts, ctx.transactions)
            .handle(new GetWalletBalanceQuery(), identity);

        expect(balance).toMatchObject({ totals: { ARS: '150.00', USD: '15.00' } });
    });
});
