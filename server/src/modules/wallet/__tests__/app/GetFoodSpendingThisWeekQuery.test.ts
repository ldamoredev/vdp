import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetFoodSpendingThisWeekQuery, GetFoodSpendingThisWeekQueryHandler } from '../../app/GetFoodSpendingThisWeekQuery';
import { identity, makeCategory, makeTransaction, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('GetFoodSpendingThisWeekQuery', () => {
    let ctx: WalletCQBusTestContext;

    beforeEach(() => {
        ctx = setupWalletCQBusTest(); // clock pinned to Wed 2026-06-17; week starts Mon 2026-06-15
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    function run() {
        return new GetFoodSpendingThisWeekQueryHandler(ctx.transactions, ctx.categories)
            .handle(new GetFoodSpendingThisWeekQuery(), identity);
    }

    it('sums this-week eating-out spend, grouped by currency, never mixing currencies', async () => {
        ctx.categories.seed([
            makeCategory({ id: 'cat-food', name: 'Delivery', type: 'expense' }),
            makeCategory({ id: 'cat-other', name: 'Transporte', type: 'expense' }),
        ]);
        ctx.transactions.seed([
            makeTransaction({ id: 'tx-1', categoryId: 'cat-food', amount: '1000', currency: 'ARS', date: '2026-06-16' }),
            makeTransaction({ id: 'tx-2', categoryId: 'cat-food', amount: '500', currency: 'ARS', date: '2026-06-17' }),
            makeTransaction({ id: 'tx-3', categoryId: 'cat-food', amount: '20', currency: 'USD', date: '2026-06-15' }),
            makeTransaction({ id: 'tx-4', categoryId: 'cat-other', amount: '9999', currency: 'ARS', date: '2026-06-17' }),
            makeTransaction({ id: 'tx-5', categoryId: 'cat-food', amount: '7777', currency: 'ARS', date: '2026-06-08' }),
        ]);

        const result = await run();

        expect(result.from).toBe('2026-06-15');
        expect(result.to).toBe('2026-06-17');
        expect(result.byCurrency).toEqual([
            { currency: 'ARS', total: 1500, count: 2 },
            { currency: 'USD', total: 20, count: 1 },
        ]);
    });

    it('returns an empty breakdown when there is no eating-out spend this week', async () => {
        ctx.categories.seed([makeCategory({ id: 'cat-other', name: 'Transporte', type: 'expense' })]);
        ctx.transactions.seed([
            makeTransaction({ id: 'tx-1', categoryId: 'cat-other', amount: '300', currency: 'ARS', date: '2026-06-17' }),
        ]);

        const result = await run();

        expect(result.byCurrency).toEqual([]);
        expect(result.from).toBe('2026-06-15');
    });
});
