import { describe, it, expect } from 'vitest';
import { localDateISO } from '../../../common/base/time/dates';
import { FakeCategoryRepository } from '../../infrastructure/fake/FakeCategoryRepository';
import { FakeTransactionRepository } from '../../infrastructure/fake/FakeTransactionRepository';
import type { CategoryTrend } from '../../services/GetCategoryTrends';
import { GetCategoryTrends } from '../../services/GetCategoryTrends';

describe('GetCategoryTrends', () => {
    function createService() {
        const transactions = new FakeTransactionRepository();
        const categories = new FakeCategoryRepository();

        return {
            service: new GetCategoryTrends(transactions, categories),
            transactions,
            categories,
        };
    }

    it('returns an empty array when no transactions exist', async () => {
        const { service } = createService();

        const result = await service.execute('user-1');

        expect(result).toEqual<CategoryTrend[]>([]);
    });

    it('marks a category as up when this week is more than 10 percent above last week', async () => {
        const { service, transactions, categories } = createService();
        const category = await categories.create('user-1', { name: 'Transporte', type: 'expense' });
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        await transactions.create('user-1', {
            accountId: 'acc-1',
            type: 'expense',
            amount: '1000',
            currency: 'ARS',
            description: null,
            date: localDateISO(lastWeek),
            categoryId: category.id,
            tags: [],
        });

        await transactions.create('user-1', {
            accountId: 'acc-1',
            type: 'expense',
            amount: '1500',
            currency: 'ARS',
            description: null,
            date: localDateISO(),
            categoryId: category.id,
            tags: [],
        });

        const result = await service.execute('user-1');

        expect(result).toEqual([
            {
                category: 'Transporte',
                thisWeek: 1500,
                lastWeek: 1000,
                change: 50,
                trend: 'up',
            },
        ]);
    });

    it('marks a category as stable when the weekly change stays within plus or minus 10 percent', async () => {
        const { service, transactions, categories } = createService();
        const category = await categories.create('user-1', { name: 'Comida', type: 'expense' });
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        await transactions.create('user-1', {
            accountId: 'acc-1',
            type: 'expense',
            amount: '1000',
            currency: 'ARS',
            description: null,
            date: localDateISO(lastWeek),
            categoryId: category.id,
            tags: [],
        });

        await transactions.create('user-1', {
            accountId: 'acc-1',
            type: 'expense',
            amount: '1050',
            currency: 'ARS',
            description: null,
            date: localDateISO(),
            categoryId: category.id,
            tags: [],
        });

        const result = await service.execute('user-1');

        expect(result).toEqual([
            {
                category: 'Comida',
                thisWeek: 1050,
                lastWeek: 1000,
                change: 5,
                trend: 'stable',
            },
        ]);
    });
});
