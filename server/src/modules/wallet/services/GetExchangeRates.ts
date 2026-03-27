import { ExchangeRate } from '../domain/ExchangeRate';
import { ExchangeRateRepository } from '../domain/ExchangeRateRepository';

export class GetExchangeRates {
    constructor(private readonly exchangeRates: ExchangeRateRepository) {}

    async executeLatest(): Promise<ExchangeRate[]> {
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
