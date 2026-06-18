import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DeleteTransactionCommand, DeleteTransactionCommandHandler } from '../../app/DeleteTransactionCommand';
import { identity, makeTransaction, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('DeleteTransactionCommand', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('deletes an existing transaction', async () => {
        ctx.transactions.seed([makeTransaction({ id: 'tx-1' })]);

        const tx = await new DeleteTransactionCommandHandler(ctx.transactions)
            .handle(new DeleteTransactionCommand('tx-1'), identity);

        expect(tx).toMatchObject({ id: 'tx-1' });
        expect(ctx.transactions.size).toBe(0);
    });
});
