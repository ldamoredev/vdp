import { Command, RequestHandler } from '@nbottarini/cqbus';

import { todayISO } from '../../common/base/time/dates';
import { CreateExchangeRateData, ExchangeRate } from '../domain/ExchangeRate';
import { ExchangeRateRepository } from '../domain/ExchangeRateRepository';

export class CreateExchangeRateCommand extends Command<ExchangeRate> {
    constructor(readonly input: Omit<CreateExchangeRateData, 'date'> & { date?: string }) {
        super();
    }
}

export class CreateExchangeRateCommandHandler implements RequestHandler<CreateExchangeRateCommand, ExchangeRate> {
    constructor(private readonly exchangeRates: ExchangeRateRepository) {}

    async handle(command: CreateExchangeRateCommand): Promise<ExchangeRate> {
        return this.exchangeRates.create({
            ...command.input,
            date: command.input.date ?? todayISO(),
        });
    }
}
