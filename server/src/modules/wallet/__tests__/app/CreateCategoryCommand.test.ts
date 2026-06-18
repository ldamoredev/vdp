import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateCategoryCommand, CreateCategoryCommandHandler } from '../../app/CreateCategoryCommand';
import { identity, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('CreateCategoryCommand', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('creates a category', async () => {
        const category = await new CreateCategoryCommandHandler(ctx.categories)
            .handle(new CreateCategoryCommand({ name: 'Food', type: 'expense' }), identity);

        expect(category).toMatchObject({ name: 'Food', type: 'expense' });
    });
});
