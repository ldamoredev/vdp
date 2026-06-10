import { randomUUID } from 'crypto';
import { CreateExchangeRateData, ExchangeRate } from '../../domain/ExchangeRate';
import { ExchangeRateRepository } from '../../domain/ExchangeRateRepository';

export class FakeExchangeRateRepository extends ExchangeRateRepository {
    private store = new Map<string, ExchangeRate>();

    seed(rates: ExchangeRate[]): void {
        for (const rate of rates) {
            this.store.set(rate.id, rate);
        }
    }

    async findAll(): Promise<ExchangeRate[]> {
        return Array.from(this.store.values());
    }

    async create(data: CreateExchangeRateData): Promise<ExchangeRate> {
        const rate: ExchangeRate = {
            id: randomUUID(),
            fromCurrency: data.fromCurrency,
            toCurrency: data.toCurrency,
            rate: data.rate,
            type: data.type,
            date: data.date,
            createdAt: new Date(),
        };
        this.store.set(rate.id, rate);
        return rate;
    }
}
