import { DomainHttpError } from '../../common/http/errors';
import { ExchangeRate } from '../domain/ExchangeRate';

export const DEFAULT_PRESENTATION_CURRENCY = 'ARS';
export const DEFAULT_EXCHANGE_RATE_TYPE = 'mep';

export type CurrencyConversionRate = {
    readonly fromCurrency: string;
    readonly toCurrency: string;
    readonly rate: string;
    readonly date: string;
};

export type CurrencyConversion = {
    readonly rateType: string;
    readonly rates: readonly CurrencyConversionRate[];
};

export class CurrencyConverter {
    private readonly used = new Map<string, CurrencyConversionRate>();

    constructor(
        private readonly targetCurrency: string,
        private readonly rateType: string,
        private readonly rates: readonly ExchangeRate[],
    ) {}

    convert(amount: number, fromCurrency: string, toCurrency = this.targetCurrency): number {
        if (fromCurrency === toCurrency) return amount;

        const direct = this.latestRate(fromCurrency, toCurrency);
        if (direct) {
            const rate = Number.parseFloat(direct.rate);
            this.trackUsedRate(fromCurrency, toCurrency, rate, direct.date);
            return amount * rate;
        }

        const inverse = this.latestRate(toCurrency, fromCurrency);
        if (inverse) {
            const rate = 1 / Number.parseFloat(inverse.rate);
            this.trackUsedRate(fromCurrency, toCurrency, rate, inverse.date);
            return amount * rate;
        }

        throw new DomainHttpError(`Missing ${this.rateType} exchange rate for ${fromCurrency} to ${toCurrency}`);
    }

    usedRates(): CurrencyConversionRate[] {
        return Array.from(this.used.values()).sort((a, b) => a.fromCurrency.localeCompare(b.fromCurrency));
    }

    private latestRate(fromCurrency: string, toCurrency: string): ExchangeRate | undefined {
        return this.rates
            .filter((rate) =>
                rate.fromCurrency === fromCurrency &&
                rate.toCurrency === toCurrency &&
                rate.type === this.rateType
            )
            .sort((a, b) => b.date.localeCompare(a.date))[0];
    }

    private trackUsedRate(fromCurrency: string, toCurrency: string, rate: number, date: string): void {
        const key = `${fromCurrency}|${toCurrency}`;
        this.used.set(key, {
            fromCurrency,
            toCurrency,
            rate: rate.toFixed(8),
            date,
        });
    }
}
