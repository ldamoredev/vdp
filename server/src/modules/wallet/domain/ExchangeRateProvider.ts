import { CreateExchangeRateData } from './ExchangeRate';

/** A single rate fetched from an external source, ready to persist. */
export type FetchedExchangeRate = CreateExchangeRateData;

/**
 * Outbound port for pulling current dollar quotes from an external source
 * (e.g. an Argentine FX API). Infrastructure provides the concrete adapter;
 * the application layer depends only on this abstraction.
 */
export abstract class ExchangeRateProvider {
    abstract fetchDollarRates(): Promise<FetchedExchangeRate[]>;
}
