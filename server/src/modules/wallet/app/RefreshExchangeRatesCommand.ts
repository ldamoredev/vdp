import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { ExchangeRate } from '../domain/ExchangeRate';
import { ExchangeRateProvider } from '../domain/ExchangeRateProvider';
import { ExchangeRateRepository } from '../domain/ExchangeRateRepository';

/**
 * Pulls the current dollar quotes from the external provider and persists them.
 * Exchange rates are global (not user-owned), so no identity is required; the
 * route that exposes this stays behind the authenticated wallet surface.
 */
export class RefreshExchangeRatesCommand extends Command<ExchangeRate[]> {}

export class RefreshExchangeRatesCommandHandler implements RequestHandler<RefreshExchangeRatesCommand, ExchangeRate[]> {
    constructor(
        private readonly provider: ExchangeRateProvider,
        private readonly exchangeRates: ExchangeRateRepository,
    ) {}

    async handle(_command: RefreshExchangeRatesCommand, _identity: Identity): Promise<ExchangeRate[]> {
        const fetched = await this.provider.fetchDollarRates();
        const saved: ExchangeRate[] = [];
        for (const rate of fetched) {
            saved.push(await this.exchangeRates.upsert(rate));
        }
        return saved;
    }
}
