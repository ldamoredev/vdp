import { todayISO } from '../../../common/base/time/dates';
import { ExchangeRateProvider, FetchedExchangeRate } from '../../domain/ExchangeRateProvider';

type DolarApiEntry = {
    readonly casa: string;
    readonly compra: number;
    readonly venta: number;
};

/** dolarapi.com `casa` → our `exchange_rates.type`. Other casas are ignored. */
const CASA_TO_TYPE: Record<string, string> = {
    oficial: 'official',
    blue: 'blue',
    bolsa: 'mep',
    contadoconliqui: 'ccl',
};

/**
 * Pulls Argentine dollar quotes from the free, key-less dolarapi.com.
 * Each quote is stored as a USD→ARS sell ("venta") rate; the CurrencyConverter
 * inverts it when normalizing ARS aggregates to USD.
 */
export class DolarApiExchangeRateProvider extends ExchangeRateProvider {
    constructor(
        private readonly baseUrl = 'https://dolarapi.com',
        private readonly fetchFn: typeof fetch = fetch,
        private readonly today: () => string = todayISO,
    ) {
        super();
    }

    async fetchDollarRates(): Promise<FetchedExchangeRate[]> {
        const response = await this.fetchFn(`${this.baseUrl}/v1/dolares`);
        if (!response.ok) {
            throw new Error(`dolarapi responded ${response.status}`);
        }

        const entries = (await response.json()) as DolarApiEntry[];
        const date = this.today();
        const rates: FetchedExchangeRate[] = [];
        for (const entry of entries) {
            const type = CASA_TO_TYPE[entry.casa];
            if (!type) continue;
            if (typeof entry.venta !== 'number' || entry.venta <= 0) continue;
            rates.push({
                fromCurrency: 'USD',
                toCurrency: 'ARS',
                rate: entry.venta.toFixed(2),
                type,
                date,
            });
        }
        return rates;
    }
}
