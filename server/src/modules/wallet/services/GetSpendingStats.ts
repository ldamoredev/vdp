import { TransactionRepository } from '../domain/TransactionRepository';
import { CategoryRepository } from '../domain/CategoryRepository';
import { localDateISO } from '../../common/base/time/dates';

export type SpendingSummary = {
    readonly totalIncome: string;
    readonly totalExpenses: string;
    readonly netBalance: string;
    readonly transactionCount: number;
};

export type CategoryStat = {
    readonly categoryId: string | null;
    readonly categoryName: string;
    readonly total: number;
    readonly count: number;
};

export type MonthlyTrendPoint = {
    readonly month: string;
    readonly income: number;
    readonly expense: number;
};

export class GetSpendingStats {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async executeSummary(userId: string, from?: string, to?: string, accountId?: string): Promise<SpendingSummary> {
        const now = new Date();
        const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const defaultTo = localDateISO(now);

        const effectiveFrom = from ?? defaultFrom;
        const effectiveTo = to ?? defaultTo;

        const result = await this.transactions.list(userId, {
            from: effectiveFrom,
            to: effectiveTo,
            accountId,
            limit: 10000,
            offset: 0,
        });

        let totalIncome = 0;
        let totalExpenses = 0;

        for (const tx of result.transactions) {
            const amount = parseFloat(tx.amount);
            if (tx.type === 'income') {
                totalIncome += amount;
            } else if (tx.type === 'expense') {
                totalExpenses += amount;
            }
        }

        return {
            totalIncome: totalIncome.toFixed(2),
            totalExpenses: totalExpenses.toFixed(2),
            netBalance: (totalIncome - totalExpenses).toFixed(2),
            transactionCount: result.total,
        };
    }

    async executeByCategory(userId: string, from?: string, to?: string): Promise<CategoryStat[]> {
        const now = new Date();
        const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const defaultTo = localDateISO(now);

        const result = await this.transactions.list(userId, {
            from: from ?? defaultFrom,
            to: to ?? defaultTo,
            type: 'expense',
            limit: 10000,
            offset: 0,
        });

        const categories = await this.categories.findAll(userId, 'expense');
        const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
        const totals = new Map<string | null, { total: number; count: number }>();

        for (const transaction of result.transactions) {
            const key = transaction.categoryId ?? null;
            const existing = totals.get(key) ?? { total: 0, count: 0 };
            existing.total += parseFloat(transaction.amount);
            existing.count += 1;
            totals.set(key, existing);
        }

        return Array.from(totals.entries())
            .map(([categoryId, summary]) => ({
                categoryId,
                categoryName: categoryId ? (categoryNames.get(categoryId) ?? 'Sin categoria') : 'Sin categoria',
                total: Number(summary.total.toFixed(2)),
                count: summary.count,
            }))
            .sort((a, b) => b.total - a.total);
    }

    async executeMonthlyTrend(userId: string, year?: number): Promise<MonthlyTrendPoint[]> {
        const effectiveYear = year ?? new Date().getFullYear();
        const result = await this.transactions.list(userId, {
            from: `${effectiveYear}-01-01`,
            to: `${effectiveYear}-12-31`,
            limit: 10000,
            offset: 0,
        });

        const months = new Map<string, { income: number; expense: number }>();
        for (const transaction of result.transactions) {
            const month = transaction.date.slice(0, 7);
            const existing = months.get(month) ?? { income: 0, expense: 0 };
            const amount = parseFloat(transaction.amount);

            if (transaction.type === 'income') existing.income += amount;
            if (transaction.type === 'expense') existing.expense += amount;

            months.set(month, existing);
        }

        return Array.from(months.entries())
            .map(([month, totals]) => ({
                month,
                income: Number(totals.income.toFixed(2)),
                expense: Number(totals.expense.toFixed(2)),
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }
}
