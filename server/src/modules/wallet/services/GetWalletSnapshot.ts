import { localDateISO } from '../../common/base/time/dates';
import { CategoryRepository } from '../domain/CategoryRepository';
import { TransactionRepository } from '../domain/TransactionRepository';

export type WalletSnapshotSpending = {
    readonly totalIncome: string;
    readonly totalExpenses: string;
    readonly netBalance: string;
    readonly transactionCount: number;
};

export type WalletSnapshotCategory = {
    readonly categoryName: string;
    readonly total: number;
};

export type WalletSnapshotAnomaly = {
    readonly category: string;
    readonly currentWeek: number;
    readonly average: number;
    readonly percentageChange: number;
};

export type WalletSnapshot = {
    readonly todaySpending: WalletSnapshotSpending;
    readonly topCategories: readonly WalletSnapshotCategory[];
    readonly anomalies: readonly WalletSnapshotAnomaly[];
};

export class GetWalletSnapshot {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async execute(userId: string): Promise<WalletSnapshot> {
        const today = localDateISO();

        return {
            todaySpending: await this.getTodaySpending(userId, today),
            topCategories: await this.getTopCategories(userId, today),
            anomalies: [],
        };
    }

    private async getTodaySpending(userId: string, today: string): Promise<WalletSnapshotSpending> {
        const result = await this.transactions.list(userId, {
            from: today,
            to: today,
            limit: 10_000,
            offset: 0,
        });

        let totalIncome = 0;
        let totalExpenses = 0;

        for (const transaction of result.transactions) {
            const amount = Number.parseFloat(transaction.amount);

            if (transaction.type === 'income') {
                totalIncome += amount;
            } else if (transaction.type === 'expense') {
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

    private async getTopCategories(userId: string, today: string): Promise<WalletSnapshotCategory[]> {
        const result = await this.transactions.list(userId, {
            from: this.getWeekStart(today),
            to: today,
            type: 'expense',
            limit: 10_000,
            offset: 0,
        });

        const categories = await this.categories.findAll(userId, 'expense');
        const namesById = new Map(categories.map((category) => [category.id, category.name]));
        const totalsByCategory = new Map<string, number>();

        for (const transaction of result.transactions) {
            const categoryName = transaction.categoryId
                ? (namesById.get(transaction.categoryId) ?? 'Sin categoria')
                : 'Sin categoria';

            totalsByCategory.set(
                categoryName,
                (totalsByCategory.get(categoryName) ?? 0) + Number.parseFloat(transaction.amount),
            );
        }

        return Array.from(totalsByCategory.entries())
            .map(([categoryName, total]) => ({
                categoryName,
                total: Number(total.toFixed(2)),
            }))
            .sort((left, right) => right.total - left.total)
            .slice(0, 3);
    }

    private getWeekStart(today: string): string {
        const date = new Date(`${today}T00:00:00`);
        const day = date.getDay();
        const diff = day === 0 ? -6 : 1 - day;

        date.setDate(date.getDate() + diff);

        return localDateISO(date);
    }
}
