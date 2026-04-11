import { describe, it, expect } from 'vitest';
import { localDateISO } from '../../../common/base/time/dates';
import type { Category } from '../../domain/Category';
import type { Transaction } from '../../domain/Transaction';
import { FakeCategoryRepository } from '../../infrastructure/fake/FakeCategoryRepository';
import { FakeTransactionRepository } from '../../infrastructure/fake/FakeTransactionRepository';
import type { WalletSnapshot } from '../../services/GetWalletSnapshot';
import { GetWalletSnapshot } from '../../services/GetWalletSnapshot';

function createCategory(overrides: Partial<Category> = {}): Category {
    return {
        id: overrides.id ?? 'cat-1',
        name: overrides.name ?? 'Comida',
        type: overrides.type ?? 'expense',
        icon: overrides.icon ?? null,
        parentId: overrides.parentId ?? null,
        createdAt: overrides.createdAt ?? new Date(),
    };
}

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
    return {
        id: overrides.id ?? 'tx-1',
        accountId: overrides.accountId ?? 'acc-1',
        categoryId: overrides.categoryId ?? null,
        type: overrides.type ?? 'expense',
        amount: overrides.amount ?? '100',
        currency: overrides.currency ?? 'ARS',
        description: overrides.description ?? 'Test transaction',
        date: overrides.date ?? localDateISO(),
        transferToAccountId: overrides.transferToAccountId ?? null,
        tags: overrides.tags ?? [],
        createdAt: overrides.createdAt ?? new Date(),
        updatedAt: overrides.updatedAt ?? new Date(),
    };
}

describe('GetWalletSnapshot', () => {
    function createService() {
        const transactions = new FakeTransactionRepository();
        const categories = new FakeCategoryRepository();

        return {
            service: new GetWalletSnapshot(transactions, categories),
            transactions,
            categories,
        };
    }

    it('returns an empty snapshot when no transactions exist', async () => {
        const { service } = createService();

        const result = await service.execute('user-1');

        expect(result).toEqual<WalletSnapshot>({
            todaySpending: {
                totalIncome: '0.00',
                totalExpenses: '0.00',
                netBalance: '0.00',
                transactionCount: 0,
            },
            topCategories: [],
            anomalies: [],
        });
    });

    it('summarizes today spending across income and expense transactions', async () => {
        const { service, transactions } = createService();
        const today = localDateISO();

        transactions.seed([
            createTransaction({ id: 'tx-income', type: 'income', amount: '2500', date: today }),
            createTransaction({ id: 'tx-expense', type: 'expense', amount: '800', date: today }),
            createTransaction({ id: 'tx-old', type: 'expense', amount: '999', date: '2026-01-01' }),
        ]);

        const result = await service.execute('user-1');

        expect(result.todaySpending).toEqual({
            totalIncome: '2500.00',
            totalExpenses: '800.00',
            netBalance: '1700.00',
            transactionCount: 2,
        });
    });

    it('returns the top three expense categories for the current week sorted by amount', async () => {
        const { service, transactions, categories } = createService();
        const today = localDateISO();

        categories.seed([
            createCategory({ id: 'cat-food', name: 'Comida' }),
            createCategory({ id: 'cat-transport', name: 'Transporte' }),
            createCategory({ id: 'cat-fun', name: 'Entretenimiento' }),
            createCategory({ id: 'cat-health', name: 'Salud' }),
        ]);

        transactions.seed([
            createTransaction({ id: 'tx-1', categoryId: 'cat-food', amount: '1200', date: today }),
            createTransaction({ id: 'tx-2', categoryId: 'cat-transport', amount: '3200', date: today }),
            createTransaction({ id: 'tx-3', categoryId: 'cat-fun', amount: '900', date: today }),
            createTransaction({ id: 'tx-4', categoryId: 'cat-health', amount: '400', date: today }),
            createTransaction({ id: 'tx-5', type: 'income', categoryId: 'cat-food', amount: '10000', date: today }),
        ]);

        const result = await service.execute('user-1');

        expect(result.topCategories).toEqual([
            { categoryName: 'Transporte', total: 3200 },
            { categoryName: 'Comida', total: 1200 },
            { categoryName: 'Entretenimiento', total: 900 },
        ]);
    });
});
