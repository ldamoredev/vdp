import { Query, RequestHandler } from '@nbottarini/cqbus';

import { ExchangeRate } from '../domain/ExchangeRate';
import { ExchangeRateRepository } from '../domain/ExchangeRateRepository';

export class GetExchangeRatesQuery extends Query<ExchangeRate[]> {}

export class GetExchangeRatesQueryHandler implements RequestHandler<GetExchangeRatesQuery, ExchangeRate[]> {
    constructor(private readonly exchangeRates: ExchangeRateRepository) {}

    async handle(_query: GetExchangeRatesQuery): Promise<ExchangeRate[]> {
        const rates = await this.exchangeRates.findAll();

        const latestByKey = new Map<string, ExchangeRate>();
        for (const rate of rates) {
            const key = `${rate.fromCurrency}:${rate.toCurrency}:${rate.type}`;
            const existing = latestByKey.get(key);
            if (!existing || rate.date > existing.date) {
                latestByKey.set(key, rate);
            }
        }

        return Array.from(latestByKey.values()).sort((a, b) => a.type.localeCompare(b.type));
    }
}
