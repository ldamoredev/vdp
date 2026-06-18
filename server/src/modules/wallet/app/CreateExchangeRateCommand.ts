import { Command, RequestHandler } from '@nbottarini/cqbus';

import { CreateExchangeRateData, ExchangeRate } from '../domain/ExchangeRate';
import { ExchangeRateRepository } from '../domain/ExchangeRateRepository';
import { CreateExchangeRate } from '../services/CreateExchangeRate';

export class CreateExchangeRateCommand extends Command<ExchangeRate> {
    constructor(readonly input: Omit<CreateExchangeRateData, 'date'> & { date?: string }) {
        super();
    }
}

export class CreateExchangeRateCommandHandler implements RequestHandler<CreateExchangeRateCommand, ExchangeRate> {
    constructor(private readonly exchangeRates: ExchangeRateRepository) {}

    async handle(command: CreateExchangeRateCommand): Promise<ExchangeRate> {
        return new CreateExchangeRate(this.exchangeRates).execute(command.input);
    }
}
