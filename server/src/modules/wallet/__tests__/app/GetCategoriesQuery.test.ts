import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetCategoriesQuery, GetCategoriesQueryHandler } from '../../app/GetCategoriesQuery';
import { identity, makeCategory, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('GetCategoriesQuery', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('filters categories by type', async () => {
        ctx.categories.seed([
            makeCategory({ id: 'cat-1', name: 'Food', type: 'expense' }),
            makeCategory({ id: 'cat-2', name: 'Salary', type: 'income' }),
        ]);

        const categories = await new GetCategoriesQueryHandler(ctx.categories)
            .handle(new GetCategoriesQuery('expense'), identity);

        expect(categories).toEqual([expect.objectContaining({ name: 'Food' })]);
    });
});
