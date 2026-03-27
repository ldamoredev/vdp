import { CreateExchangeRateData, ExchangeRate } from './ExchangeRate';

export abstract class ExchangeRateRepository {
    abstract findAll(): Promise<ExchangeRate[]>;
    abstract create(data: CreateExchangeRateData): Promise<ExchangeRate>;
}
