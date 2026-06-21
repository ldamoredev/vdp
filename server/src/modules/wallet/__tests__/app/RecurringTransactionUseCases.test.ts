import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundHttpError } from '../../../common/http/errors';
import {
    CreateRecurringTransactionCommand,
    CreateRecurringTransactionCommandHandler,
} from '../../app/CreateRecurringTransactionCommand';
import {
    GetRecurringTransactionsQuery,
    GetRecurringTransactionsQueryHandler,
} from '../../app/GetRecurringTransactionsQuery';
import {
    MaterializeDueRecurringTransactionsCommand,
    MaterializeDueRecurringTransactionsCommandHandler,
} from '../../app/MaterializeDueRecurringTransactionsCommand';
import { RecurringTransaction } from '../../domain/RecurringTransaction';
import { FakeRecurringTransactionRepository } from '../fakes/FakeRecurringTransactionRepository';
import { identity, makeAccount, makeCategory, setupWalletCQBusTest, type WalletCQBusTestContext } from './wallet-cqbus-test-helpers';

describe('Recurring transaction use cases', () => {
    let ctx: WalletCQBusTestContext;
    let recurring: FakeRecurringTransactionRepository;

    beforeEach(() => {
        ctx = setupWalletCQBusTest(); // clock pinned to 2026-06-17
        recurring = new FakeRecurringTransactionRepository();
    });

    afterEach(() => vi.useRealTimers());

    const createHandler = () => new CreateRecurringTransactionCommandHandler(recurring, ctx.accounts, ctx.categories);

    it('creates a rule when the account exists', async () => {
        ctx.accounts.seed([makeAccount({ id: 'acc-1' })]);
        ctx.categories.seed([makeCategory({ id: 'cat-1' })]);

        const created = await createHandler().handle(
            new CreateRecurringTransactionCommand({
                accountId: 'acc-1', categoryId: 'cat-1', type: 'expense',
                amount: '50000', currency: 'ARS', description: 'Alquiler',
                dayOfMonth: 1, startDate: '2026-04-01',
            }),
            identity,
        );

        expect(created.amount).toBe('50000');
        const stored = await new GetRecurringTransactionsQueryHandler(recurring)
            .handle(new GetRecurringTransactionsQuery(), identity);
        expect(stored).toHaveLength(1);
    });

    it('rejects creating a rule for a missing account', async () => {
        await expect(
            createHandler().handle(
                new CreateRecurringTransactionCommand({
                    accountId: 'nope', type: 'expense', amount: '1', currency: 'ARS',
                    dayOfMonth: 1, startDate: '2026-04-01',
                }),
                identity,
            ),
        ).rejects.toBeInstanceOf(NotFoundHttpError);
    });

    it('materializes due occurrences for the authenticated user', async () => {
        recurring.seed([
            RecurringTransaction.fromSnapshot({
                id: 'r1', accountId: 'acc-1', categoryId: 'cat-1', type: 'expense',
                amount: '50000', currency: 'ARS', description: 'Alquiler',
                dayOfMonth: 1, startDate: '2026-05-01', endDate: null, lastRunDate: null,
                active: true, createdAt: new Date('2026-05-01'), updatedAt: new Date('2026-05-01'),
            }),
        ]);

        const created = await new MaterializeDueRecurringTransactionsCommandHandler(recurring, ctx.transactions)
            .handle(new MaterializeDueRecurringTransactionsCommand(), identity);

        expect(created).toBe(2); // 2026-05-01 and 2026-06-01
        expect((await ctx.transactions.list('user-1', { limit: 100 })).transactions).toHaveLength(2);
    });
});
