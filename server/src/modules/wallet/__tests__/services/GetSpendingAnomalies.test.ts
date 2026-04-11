import { describe, it, expect } from 'vitest';
import { localDateISO } from '../../../common/base/time/dates';
import { FakeCategoryRepository } from '../../infrastructure/fake/FakeCategoryRepository';
import { FakeTransactionRepository } from '../../infrastructure/fake/FakeTransactionRepository';
import type { SpendingAnomaly } from '../../services/GetSpendingAnomalies';
import { GetSpendingAnomalies } from '../../services/GetSpendingAnomalies';

describe('GetSpendingAnomalies', () => {
    function createService() {
        const transactions = new FakeTransactionRepository();
        const categories = new FakeCategoryRepository();

        return {
            service: new GetSpendingAnomalies(transactions, categories),
            transactions,
            categories,
        };
    }

    it('returns an empty array when no transactions exist', async () => {
        const { service } = createService();

        const result = await service.execute('user-1');

        expect(result).toEqual<SpendingAnomaly[]>([]);
    });

    it('detects a category anomaly when current week spending is more than 50 percent above history', async () => {
        const { service, transactions, categories } = createService();
        const category = await categories.create('user-1', { name: 'Delivery', type: 'expense' });

        for (let week = 1; week <= 4; week += 1) {
            const date = new Date();
            date.setDate(date.getDate() - (week * 7));

            await transactions.create('user-1', {
                accountId: 'acc-1',
                type: 'expense',
                amount: '1000',
                currency: 'ARS',
                description: null,
                date: localDateISO(date),
                categoryId: category.id,
                tags: [],
            });
        }

        await transactions.create('user-1', {
            accountId: 'acc-1',
            type: 'expense',
            amount: '2000',
            currency: 'ARS',
            description: null,
            date: localDateISO(),
            categoryId: category.id,
            tags: [],
        });

        const result = await service.execute('user-1');

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            category: 'Delivery',
            currentWeek: 2000,
            average: 1000,
            percentageChange: 100,
            direction: 'up',
        });
    });

    it('ignores categories whose current week stays within the normal range', async () => {
        const { service, transactions, categories } = createService();
        const category = await categories.create('user-1', { name: 'Comida', type: 'expense' });

        for (let week = 0; week <= 4; week += 1) {
            const date = new Date();
            date.setDate(date.getDate() - (week * 7));

            await transactions.create('user-1', {
                accountId: 'acc-1',
                type: 'expense',
                amount: '1000',
                currency: 'ARS',
                description: null,
                date: localDateISO(date),
                categoryId: category.id,
                tags: [],
            });
        }

        const result = await service.execute('user-1');

        expect(result).toEqual<SpendingAnomaly[]>([]);
    });
});
