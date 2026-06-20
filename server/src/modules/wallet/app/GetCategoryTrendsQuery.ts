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

const STABLE_THRESHOLD_PERCENT = 10;

export type CategoryTrend = {
    readonly category: string;
    readonly currency: string;
    readonly thisWeek: number;
    readonly lastWeek: number;
    readonly change: number;
    readonly trend: 'up' | 'down' | 'stable';
};

export class GetCategoryTrendsQuery extends Query<CategoryTrend[]> {
    constructor(
        readonly currency: string = DEFAULT_PRESENTATION_CURRENCY,
        readonly rateType: string = DEFAULT_EXCHANGE_RATE_TYPE,
    ) {
        super();
    }
}

export class GetCategoryTrendsQueryHandler implements RequestHandler<GetCategoryTrendsQuery, CategoryTrend[]> {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
        private readonly exchangeRates: ExchangeRateRepository,
    ) {}

    async handle(query: GetCategoryTrendsQuery, identity: Identity): Promise<CategoryTrend[]> {
        const { userId } = requireUserIdentity(identity);
        const today = localDateISO();
        const converter = await this.createConverter(query.currency, query.rateType);
        const thisWeekStart = this.getWeekStart(today);
        const thisWeekTotals = await this.getCategoryTotals(userId, thisWeekStart, today, query.currency, converter);

        const lastWeekDate = new Date(`${today}T00:00:00`);
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        const lastWeekAnchor = localDateISO(lastWeekDate);
        const lastWeekTotals = await this.getCategoryTotals(
            userId,
            this.getWeekStart(lastWeekAnchor),
            this.getWeekEnd(lastWeekAnchor),
            query.currency,
            converter,
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
                currency: query.currency,
                thisWeek: Number(thisWeek.toFixed(2)),
                lastWeek: Number(lastWeek.toFixed(2)),
                change: Math.round(change),
                trend,
            });
        }

        return trends.sort((left, right) => Math.abs(right.change) - Math.abs(left.change));
    }

    private async getCategoryTotals(
        userId: string,
        from: string,
        to: string,
        currency: string,
        converter: CurrencyConverter,
    ): Promise<Map<string, number>> {
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

            const amount = converter.convert(
                Number.parseFloat(transaction.amount),
                transaction.currency,
                currency,
            );
            totals.set(
                transaction.categoryId,
                (totals.get(transaction.categoryId) ?? 0) + amount,
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

    private async createConverter(targetCurrency: string, rateType: string): Promise<CurrencyConverter> {
        const rates = await this.exchangeRates.findAll();
        return new CurrencyConverter(targetCurrency, rateType, rates);
    }

    private getWeekEnd(dateISO: string): string {
        const date = new Date(`${dateISO}T00:00:00`);
        const day = date.getDay();
        const diff = day === 0 ? 0 : 7 - day;

        date.setDate(date.getDate() + diff);

        return localDateISO(date);
    }
}
