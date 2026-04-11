import { localDateISO } from '../../common/base/time/dates';
import { CategoryRepository } from '../domain/CategoryRepository';
import { TransactionRepository } from '../domain/TransactionRepository';

const ANOMALY_THRESHOLD_PERCENT = 50;
const COMPARISON_WEEKS = 4;

export type SpendingAnomaly = {
    readonly category: string;
    readonly currentWeek: number;
    readonly average: number;
    readonly percentageChange: number;
    readonly direction: 'up' | 'down';
};

export class GetSpendingAnomalies {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async execute(userId: string): Promise<SpendingAnomaly[]> {
        const today = localDateISO();
        const weekStart = this.getWeekStart(today);
        const currentWeekTotals = await this.getCategoryTotals(userId, weekStart, today);
        const historicalAverages = await this.getHistoricalAverages(userId, today);
        const categories = await this.categories.findAll(userId, 'expense');
        const namesById = new Map(categories.map((category) => [category.id, category.name]));
        const anomalies: SpendingAnomaly[] = [];

        for (const [categoryId, currentWeek] of currentWeekTotals.entries()) {
            const average = historicalAverages.get(categoryId) ?? 0;

            if (average === 0) {
                continue;
            }

            const percentageChange = ((currentWeek - average) / average) * 100;

            if (Math.abs(percentageChange) < ANOMALY_THRESHOLD_PERCENT) {
                continue;
            }

            anomalies.push({
                category: namesById.get(categoryId) ?? 'Sin categoria',
                currentWeek: Number(currentWeek.toFixed(2)),
                average: Number(average.toFixed(2)),
                percentageChange: Math.round(percentageChange),
                direction: percentageChange >= 0 ? 'up' : 'down',
            });
        }

        return anomalies.sort((left, right) => Math.abs(right.percentageChange) - Math.abs(left.percentageChange));
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

    private async getHistoricalAverages(userId: string, today: string): Promise<Map<string, number>> {
        const weeklyTotalsByCategory = new Map<string, number[]>();
        const todayDate = new Date(`${today}T00:00:00`);

        for (let week = 1; week <= COMPARISON_WEEKS; week += 1) {
            const weekDate = new Date(todayDate);
            weekDate.setDate(weekDate.getDate() - (week * 7));

            const weekEnd = localDateISO(weekDate);
            const weekStart = this.getWeekStart(weekEnd);
            const totals = await this.getCategoryTotals(userId, weekStart, weekEnd);

            for (const [categoryId, total] of totals.entries()) {
                const history = weeklyTotalsByCategory.get(categoryId) ?? [];
                history.push(total);
                weeklyTotalsByCategory.set(categoryId, history);
            }
        }

        const averages = new Map<string, number>();

        for (const [categoryId, totals] of weeklyTotalsByCategory.entries()) {
            const sum = totals.reduce((running, total) => running + total, 0);
            averages.set(categoryId, sum / totals.length);
        }

        return averages;
    }

    private getWeekStart(dateISO: string): string {
        const date = new Date(`${dateISO}T00:00:00`);
        const day = date.getDay();
        const diff = day === 0 ? -6 : 1 - day;

        date.setDate(date.getDate() + diff);

        return localDateISO(date);
    }
}
