import { localDateISO } from '../../common/base/time/dates';
import { CategoryRepository } from '../domain/CategoryRepository';
import { TransactionRepository } from '../domain/TransactionRepository';

const STABLE_THRESHOLD_PERCENT = 10;

export type CategoryTrend = {
    readonly category: string;
    readonly thisWeek: number;
    readonly lastWeek: number;
    readonly change: number;
    readonly trend: 'up' | 'down' | 'stable';
};

export class GetCategoryTrends {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async execute(userId: string): Promise<CategoryTrend[]> {
        const today = localDateISO();
        const thisWeekStart = this.getWeekStart(today);
        const thisWeekTotals = await this.getCategoryTotals(userId, thisWeekStart, today);

        const lastWeekDate = new Date(`${today}T00:00:00`);
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        const lastWeekAnchor = localDateISO(lastWeekDate);
        const lastWeekTotals = await this.getCategoryTotals(
            userId,
            this.getWeekStart(lastWeekAnchor),
            this.getWeekEnd(lastWeekAnchor),
        );

        const categories = await this.categories.findAll(userId, 'expense');
        const namesById = new Map(categories.map((category) => [category.id, category.name]));
        const allCategoryIds = new Set([...thisWeekTotals.keys(), ...lastWeekTotals.keys()]);
        const trends: CategoryTrend[] = [];

        for (const categoryId of allCategoryIds) {
            const thisWeek = thisWeekTotals.get(categoryId) ?? 0;
            const lastWeek = lastWeekTotals.get(categoryId) ?? 0;

            if (thisWeek === 0 && lastWeek === 0) {
                continue;
            }

            const change = lastWeek === 0 ? 100 : ((thisWeek - lastWeek) / lastWeek) * 100;
            const trend = Math.abs(change) <= STABLE_THRESHOLD_PERCENT
                ? 'stable'
                : change > 0
                    ? 'up'
                    : 'down';

            trends.push({
                category: namesById.get(categoryId) ?? 'Sin categoria',
                thisWeek: Number(thisWeek.toFixed(2)),
                lastWeek: Number(lastWeek.toFixed(2)),
                change: Math.round(change),
                trend,
            });
        }

        return trends.sort((left, right) => Math.abs(right.change) - Math.abs(left.change));
    }

    private async getCategoryTotals(userId: string, from: string, to: string): Promise<Map<string, number>> {
        const result = await this.transactions.list(userId, {
            from,
            to,
            type: 'expense',
            limit: 10_000,
            offset: 0,
        });

        const totals = new Map<string, number>();

        for (const transaction of result.transactions) {
            if (!transaction.categoryId) {
                continue;
            }

            totals.set(
                transaction.categoryId,
                (totals.get(transaction.categoryId) ?? 0) + Number.parseFloat(transaction.amount),
            );
        }

        return totals;
    }

    private getWeekStart(dateISO: string): string {
        const date = new Date(`${dateISO}T00:00:00`);
        const day = date.getDay();
        const diff = day === 0 ? -6 : 1 - day;

        date.setDate(date.getDate() + diff);

        return localDateISO(date);
    }

    private getWeekEnd(dateISO: string): string {
        const date = new Date(`${dateISO}T00:00:00`);
        const day = date.getDay();
        const diff = day === 0 ? 0 : 7 - day;

        date.setDate(date.getDate() + diff);

        return localDateISO(date);
    }
}
