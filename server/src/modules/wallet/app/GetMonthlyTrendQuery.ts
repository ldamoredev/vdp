import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { ExchangeRateRepository } from '../domain/ExchangeRateRepository';
import { TransactionRepository } from '../domain/TransactionRepository';
import {
    CurrencyConverter,
    DEFAULT_EXCHANGE_RATE_TYPE,
    DEFAULT_PRESENTATION_CURRENCY,
} from '../services/CurrencyConverter';

export type MonthlyTrendPoint = {
    readonly month: string;
    readonly currency: string;
    readonly income: number;
    readonly expense: number;
};

export class GetMonthlyTrendQuery extends Query<MonthlyTrendPoint[]> {
    constructor(
        readonly year?: number,
        readonly currency: string = DEFAULT_PRESENTATION_CURRENCY,
        readonly rateType: string = DEFAULT_EXCHANGE_RATE_TYPE,
    ) {
        super();
    }
}

export class GetMonthlyTrendQueryHandler implements RequestHandler<GetMonthlyTrendQuery, MonthlyTrendPoint[]> {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly exchangeRates: ExchangeRateRepository,
    ) {}

    async handle(query: GetMonthlyTrendQuery, identity: Identity): Promise<MonthlyTrendPoint[]> {
        const { userId } = requireUserIdentity(identity);
        const effectiveYear = query.year ?? new Date().getFullYear();
        const result = await this.transactions.list(userId, {
            from: `${effectiveYear}-01-01`,
            to: `${effectiveYear}-12-31`,
            limit: 10000,
            offset: 0,
        });

        const converter = await this.createConverter(query.currency, query.rateType);
        const months = new Map<string, { income: number; expense: number }>();
        for (const transaction of result.transactions) {
            const month = transaction.date.slice(0, 7);
            const existing = months.get(month) ?? { income: 0, expense: 0 };
            const amount = converter.convert(
                Number.parseFloat(transaction.amount),
                transaction.currency,
                query.currency,
            );

            if (transaction.type === 'income') existing.income += amount;
            if (transaction.type === 'expense') existing.expense += amount;

            months.set(month, existing);
        }

        return Array.from(months.entries())
            .map(([month, totals]) => ({
                month,
                currency: query.currency,
                income: Number(totals.income.toFixed(2)),
                expense: Number(totals.expense.toFixed(2)),
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }

    private async createConverter(targetCurrency: string, rateType: string): Promise<CurrencyConverter> {
        const rates = await this.exchangeRates.findAll();
        return new CurrencyConverter(targetCurrency, rateType, rates);
    }
}
