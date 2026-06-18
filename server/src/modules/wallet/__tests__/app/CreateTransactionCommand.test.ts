import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateTransactionCommand, CreateTransactionCommandHandler } from '../../app/CreateTransactionCommand';
import { identity, makeAccount, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('CreateTransactionCommand', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('creates a transaction and emits the wallet transaction event', async () => {
        const emitted: unknown[] = [];
        ctx.accounts.seed([makeAccount({ id: 'acc-1' })]);
        ctx.eventBus.on('wallet.transaction.created', (event) => {
            emitted.push(event.payload);
        });

        const tx = await new CreateTransactionCommandHandler(
            ctx.transactions,
            ctx.eventBus,
            ctx.accounts,
            ctx.categories,
        ).handle(
            new CreateTransactionCommand({
                accountId: 'acc-1',
                type: 'expense',
                amount: '100',
                currency: 'ARS',
                date: '2026-06-17',
            }),
            identity,
        );

        expect(tx).toMatchObject({ accountId: 'acc-1', type: 'expense', amount: '100' });
        expect(emitted).toHaveLength(1);
    });
});
