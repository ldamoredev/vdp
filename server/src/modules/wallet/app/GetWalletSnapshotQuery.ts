import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { localDateISO } from '../../common/base/time/dates';
import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { CategoryRepository } from '../domain/CategoryRepository';
import { ExchangeRateRepository } from '../domain/ExchangeRateRepository';
import { TransactionRepository } from '../domain/TransactionRepository';
import {
    CurrencyConverter,
    DEFAULT_EXCHANGE_RATE_TYPE,
    DEFAULT_PRESENTATION_CURRENCY,
} from '../services/CurrencyConverter';

export type WalletSnapshotSpending = {
    readonly currency: string;
    readonly totalIncome: string;
    readonly totalExpenses: string;
    readonly netBalance: string;
    readonly transactionCount: number;
};

export type WalletSnapshotCategory = {
    readonly categoryName: string;
    readonly currency: string;
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

export class GetWalletSnapshotQuery extends Query<WalletSnapshot> {
    constructor(
        readonly currency: string = DEFAULT_PRESENTATION_CURRENCY,
        readonly rateType: string = DEFAULT_EXCHANGE_RATE_TYPE,
    ) {
        super();
    }
}

export class GetWalletSnapshotQueryHandler implements RequestHandler<GetWalletSnapshotQuery, WalletSnapshot> {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
        private readonly exchangeRates: ExchangeRateRepository,
    ) {}

    async handle(query: GetWalletSnapshotQuery, identity: Identity): Promise<WalletSnapshot> {
        const { userId } = requireUserIdentity(identity);
        const today = localDateISO();
        const converter = await this.createConverter(query.currency, query.rateType);

        return {
            todaySpending: await this.getTodaySpending(userId, today, query.currency, converter),
            topCategories: await this.getTopCategories(userId, today, query.currency, converter),
            anomalies: [],
        };
    }

    private async getTodaySpending(
        userId: string,
        today: string,
        currency: string,
        converter: CurrencyConverter,
    ): Promise<WalletSnapshotSpending> {
        const result = await this.transactions.list(userId, {
            from: today,
            to: today,
            limit: 10_000,
            offset: 0,
        });

        let totalIncome = 0;
        let totalExpenses = 0;

        for (const transaction of result.transactions) {
            const amount = converter.convert(
                Number.parseFloat(transaction.amount),
                transaction.currency,
                currency,
            );

            if (transaction.type === 'income') {
                totalIncome += amount;
            } else if (transaction.type === 'expense') {
                totalExpenses += amount;
            }
        }

        return {
            currency,
            totalIncome: totalIncome.toFixed(2),
            totalExpenses: totalExpenses.toFixed(2),
            netBalance: (totalIncome - totalExpenses).toFixed(2),
            transactionCount: result.total,
        };
    }

    private async getTopCategories(
        userId: string,
        today: string,
        currency: string,
        converter: CurrencyConverter,
    ): Promise<WalletSnapshotCategory[]> {
        const result = await this.transactions.list(userId, {
            from: this.getWeekStart(today),
            to: today,
            type: 'expense',
            limit: 10_000,
            offset: 0,
        });

        const categories = await this.categories.findAll(userId, 'expense');
        const namesById = new Map(categories.map((category) => [category.id, category.name]));
        const totalsByCategory = new Map<string, { categoryId: string | null; total: number }>();

        for (const transaction of result.transactions) {
            const categoryId = transaction.categoryId ?? null;
            const key = categoryId ?? '';
            const existing = totalsByCategory.get(key) ?? { categoryId, total: 0 };
            existing.total += converter.convert(
                Number.parseFloat(transaction.amount),
                transaction.currency,
                currency,
            );
            totalsByCategory.set(key, existing);
        }

        return Array.from(totalsByCategory.values())
            .map((summary) => ({
                categoryName: summary.categoryId
                    ? (namesById.get(summary.categoryId) ?? 'Sin categoria')
                    : 'Sin categoria',
                currency,
                total: Number(summary.total.toFixed(2)),
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

    private async createConverter(targetCurrency: string, rateType: string): Promise<CurrencyConverter> {
        const rates = await this.exchangeRates.findAll();
        return new CurrencyConverter(targetCurrency, rateType, rates);
    }
}
