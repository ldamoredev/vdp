import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UpdateTransactionCommand, UpdateTransactionCommandHandler } from '../../app/UpdateTransactionCommand';
import {
    identity,
    makeAccount,
    makeTransaction,
    setupWalletCQBusTest,
    type WalletCQBusTestContext,
} from './wallet-cqbus-test-helpers';

describe('UpdateTransactionCommand', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('updates an existing transaction', async () => {
        ctx.accounts.seed([makeAccount({ id: 'acc-1' })]);
        ctx.transactions.seed([makeTransaction({ id: 'tx-1', accountId: 'acc-1', amount: '100' })]);

        const tx = await new UpdateTransactionCommandHandler(ctx.transactions, ctx.accounts, ctx.categories)
            .handle(new UpdateTransactionCommand('tx-1', { amount: '120' }), identity);

        expect(tx).toMatchObject({ id: 'tx-1', amount: '120' });
    });

    it('returns null when the transaction does not exist', async () => {
        const tx = await new UpdateTransactionCommandHandler(ctx.transactions, ctx.accounts, ctx.categories)
            .handle(new UpdateTransactionCommand('missing', { amount: '120' }), identity);

        expect(tx).toBeNull();
    });

    it('rejects updates with a missing transfer account', async () => {
        ctx.accounts.seed([makeAccount({ id: 'acc-1' })]);
        ctx.transactions.seed([makeTransaction({ id: 'tx-1', accountId: 'acc-1' })]);

        await expect(new UpdateTransactionCommandHandler(ctx.transactions, ctx.accounts, ctx.categories)
            .handle(new UpdateTransactionCommand('tx-1', { transferToAccountId: 'missing' }), identity))
            .rejects.toThrow('Transfer account not found');
    });
});
