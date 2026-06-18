import { Query, RequestHandler } from '@nbottarini/cqbus';

import { ExchangeRate } from '../domain/ExchangeRate';
import { ExchangeRateRepository } from '../domain/ExchangeRateRepository';
import { GetExchangeRates } from '../services/GetExchangeRates';

export class GetExchangeRatesQuery extends Query<ExchangeRate[]> {}

export class GetExchangeRatesQueryHandler implements RequestHandler<GetExchangeRatesQuery, ExchangeRate[]> {
    constructor(private readonly exchangeRates: ExchangeRateRepository) {}

    async handle(_query: GetExchangeRatesQuery): Promise<ExchangeRate[]> {
        return new GetExchangeRates(this.exchangeRates).executeLatest();
    }
}
