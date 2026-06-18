import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UpdateAccountCommand, UpdateAccountCommandHandler } from '../../app/UpdateAccountCommand';
import { identity, makeAccount, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('UpdateAccountCommand', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('updates an existing account', async () => {
        ctx.accounts.seed([makeAccount({ id: 'acc-1', name: 'Old' })]);

        const account = await new UpdateAccountCommandHandler(ctx.accounts)
            .handle(new UpdateAccountCommand('acc-1', { name: 'New' }), identity);

        expect(account).toMatchObject({ id: 'acc-1', name: 'New' });
    });
});
