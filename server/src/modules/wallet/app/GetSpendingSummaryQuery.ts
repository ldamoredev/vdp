import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { localDateISO } from '../../common/base/time/dates';
import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { ExchangeRateRepository } from '../domain/ExchangeRateRepository';
import { TransactionRepository } from '../domain/TransactionRepository';
import {
    CurrencyConversion,
    CurrencyConversionRate,
    CurrencyConverter,
    DEFAULT_EXCHANGE_RATE_TYPE,
    DEFAULT_PRESENTATION_CURRENCY,
} from '../services/CurrencyConverter';

export type SpendingSummaryConversionRate = CurrencyConversionRate;
export type SpendingSummaryConversion = CurrencyConversion;

export type SpendingSummary = {
    readonly currency: string;
    readonly totalIncome: string;
    readonly totalExpenses: string;
    readonly netBalance: string;
    readonly transactionCount: number;
    readonly conversion: SpendingSummaryConversion;
};

export class GetSpendingSummaryQuery extends Query<SpendingSummary> {
    constructor(
        readonly from?: string,
        readonly to?: string,
        readonly accountId?: string,
        readonly currency: string = DEFAULT_PRESENTATION_CURRENCY,
        readonly rateType: string = DEFAULT_EXCHANGE_RATE_TYPE,
    ) {
        super();
    }
}

export class GetSpendingSummaryQueryHandler implements RequestHandler<GetSpendingSummaryQuery, SpendingSummary> {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly exchangeRates: ExchangeRateRepository,
    ) {}

    async handle(query: GetSpendingSummaryQuery, identity: Identity): Promise<SpendingSummary> {
        const { userId } = requireUserIdentity(identity);
        const now = new Date();
        const effectiveFrom = query.from ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const effectiveTo = query.to ?? localDateISO(now);

        const result = await this.transactions.list(userId, {
            from: effectiveFrom,
            to: effectiveTo,
            accountId: query.accountId,
            limit: 10000,
            offset: 0,
        });

        const converter = await this.createConverter(query.currency, query.rateType);
        let totalIncome = 0;
        let totalExpenses = 0;

        for (const transaction of result.transactions) {
            const amount = converter.convert(
                Number.parseFloat(transaction.amount),
                transaction.currency,
                query.currency,
            );
            if (transaction.type === 'income') {
                totalIncome += amount;
            } else if (transaction.type === 'expense') {
                totalExpenses += amount;
            }
        }

        return {
            currency: query.currency,
            totalIncome: totalIncome.toFixed(2),
            totalExpenses: totalExpenses.toFixed(2),
            netBalance: (totalIncome - totalExpenses).toFixed(2),
            transactionCount: result.total,
            conversion: {
                rateType: query.rateType,
                rates: converter.usedRates(),
            },
        };
    }

    private async createConverter(targetCurrency: string, rateType: string): Promise<CurrencyConverter> {
        const rates = await this.exchangeRates.findAll();
        return new CurrencyConverter(targetCurrency, rateType, rates);
    }
}
