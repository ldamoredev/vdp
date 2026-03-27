import { todayISO } from '../../common/base/time/dates';
import { CreateExchangeRateData, ExchangeRate } from '../domain/ExchangeRate';
import { ExchangeRateRepository } from '../domain/ExchangeRateRepository';

export class CreateExchangeRate {
    constructor(private readonly exchangeRates: ExchangeRateRepository) {}

    async execute(data: Omit<CreateExchangeRateData, 'date'> & { date?: string }): Promise<ExchangeRate> {
        return this.exchangeRates.create({
            ...data,
            date: data.date ?? todayISO(),
        });
    }
}
