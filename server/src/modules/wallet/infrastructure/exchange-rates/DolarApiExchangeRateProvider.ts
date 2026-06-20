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
        private readonly timeoutMs = 5000,
    ) {
        super();
    }

    async fetchDollarRates(): Promise<FetchedExchangeRate[]> {
        let response: Response;
        try {
            response = await this.fetchFn(`${this.baseUrl}/v1/dolares`, {
                signal: AbortSignal.timeout(this.timeoutMs),
            });
        } catch (err: unknown) {
            // Time-box the external call so a hung dolarapi never blocks the
            // request (and, via the web lazy refresh, the wallet screens).
            throw new Error(`dolarapi request failed: ${err instanceof Error ? err.message : String(err)}`);
        }
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
