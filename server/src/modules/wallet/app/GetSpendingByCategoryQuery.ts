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

export type CategoryStat = {
    readonly categoryId: string | null;
    readonly categoryName: string;
    readonly currency: string;
    readonly total: number;
    readonly count: number;
};

export class GetSpendingByCategoryQuery extends Query<CategoryStat[]> {
    constructor(
        readonly from?: string,
        readonly to?: string,
        readonly currency: string = DEFAULT_PRESENTATION_CURRENCY,
        readonly rateType: string = DEFAULT_EXCHANGE_RATE_TYPE,
    ) {
        super();
    }
}

export class GetSpendingByCategoryQueryHandler implements RequestHandler<GetSpendingByCategoryQuery, CategoryStat[]> {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
        private readonly exchangeRates: ExchangeRateRepository,
    ) {}

    async handle(query: GetSpendingByCategoryQuery, identity: Identity): Promise<CategoryStat[]> {
        const { userId } = requireUserIdentity(identity);
        const now = new Date();
        const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const defaultTo = localDateISO(now);

        const result = await this.transactions.list(userId, {
            from: query.from ?? defaultFrom,
            to: query.to ?? defaultTo,
            type: 'expense',
            limit: 10000,
            offset: 0,
        });

        const categories = await this.categories.findAll(userId, 'expense');
        const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
        const converter = await this.createConverter(query.currency, query.rateType);
        const totals = new Map<string, { categoryId: string | null; total: number; count: number }>();

        for (const transaction of result.transactions) {
            const categoryId = transaction.categoryId ?? null;
            const key = categoryId ?? '';
            const existing = totals.get(key) ?? { categoryId, total: 0, count: 0 };
            existing.total += converter.convert(
                Number.parseFloat(transaction.amount),
                transaction.currency,
                query.currency,
            );
            existing.count += 1;
            totals.set(key, existing);
        }

        return Array.from(totals.values())
            .map((summary) => ({
                categoryId: summary.categoryId,
                categoryName: summary.categoryId
                    ? (categoryNames.get(summary.categoryId) ?? 'Sin categoria')
                    : 'Sin categoria',
                currency: query.currency,
                total: Number(summary.total.toFixed(2)),
                count: summary.count,
            }))
            .sort((a, b) => b.total - a.total);
    }

    private async createConverter(targetCurrency: string, rateType: string): Promise<CurrencyConverter> {
        const rates = await this.exchangeRates.findAll();
        return new CurrencyConverter(targetCurrency, rateType, rates);
    }
}
