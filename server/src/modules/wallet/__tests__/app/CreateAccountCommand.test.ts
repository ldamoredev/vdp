import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateAccountCommand, CreateAccountCommandHandler } from '../../app/CreateAccountCommand';
import { identity, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('CreateAccountCommand', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('creates an account for the authenticated user', async () => {
        const account = await new CreateAccountCommandHandler(ctx.accounts)
            .handle(new CreateAccountCommand({ name: 'Savings', currency: 'USD', type: 'savings' }), identity);

        expect(account).toMatchObject({ name: 'Savings', currency: 'USD', type: 'savings', initialBalance: '0' });
    });
});
