import { CreateExchangeRateData, ExchangeRate } from './ExchangeRate';

export abstract class ExchangeRateRepository {
    abstract findAll(): Promise<ExchangeRate[]>;
    abstract create(data: CreateExchangeRateData): Promise<ExchangeRate>;
    /** Insert or, when a rate for the same (from, to, type, date) already
     * exists, update its value. Idempotent for repeated same-day refreshes. */
    abstract upsert(data: CreateExchangeRateData): Promise<ExchangeRate>;
}
