import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DeleteAccountCommand, DeleteAccountCommandHandler } from '../../app/DeleteAccountCommand';
import { identity, makeAccount, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('DeleteAccountCommand', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('deletes an existing account', async () => {
        ctx.accounts.seed([makeAccount({ id: 'acc-1' })]);

        const account = await new DeleteAccountCommandHandler(ctx.accounts)
            .handle(new DeleteAccountCommand('acc-1'), identity);

        expect(account).toMatchObject({ id: 'acc-1' });
        expect(ctx.accounts.size).toBe(0);
    });
});
