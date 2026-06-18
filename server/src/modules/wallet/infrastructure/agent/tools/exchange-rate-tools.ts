import { CQBus } from '@nbottarini/cqbus';

import { executionContextFromAuth } from '../../../../common/app/auth/AuthExecutionContext';
import { AuthContextStorage } from '../../../../common/http/AuthContextStorage';
import { CreateExchangeRateCommand } from '../../../app/CreateExchangeRateCommand';
import { GetExchangeRatesQuery } from '../../../app/GetExchangeRatesQuery';
import { CURRENCIES, EXCHANGE_RATE_TYPES, jsonTool } from './shared';

export function createExchangeRateTools(bus: CQBus, authContextStorage: AuthContextStorage) {
    const executionContext = () => executionContextFromAuth(authContextStorage.getAuthContext());

    return [
        jsonTool({
            name: 'get_exchange_rates',
            description:
                'Get the latest exchange rates recorded in the wallet. Supports optional filtering by pair and rate type.',
            inputSchema: {
                type: 'object',
                properties: {
                    fromCurrency: { type: 'string', enum: CURRENCIES, description: 'Optional origin currency filter' },
                    toCurrency: { type: 'string', enum: CURRENCIES, description: 'Optional target currency filter' },
                    type: { type: 'string', enum: EXCHANGE_RATE_TYPES, description: 'Optional exchange rate type filter' },
                },
                required: [],
            },
            execute: async (input) => {
                const rates = await bus.execute(new GetExchangeRatesQuery(), executionContext());
                return rates.filter((rate) => {
                    if (input.fromCurrency && rate.fromCurrency !== input.fromCurrency) return false;
                    if (input.toCurrency && rate.toCurrency !== input.toCurrency) return false;
                    if (input.type && rate.type !== input.type) return false;
                    return true;
                });
            },
        }),
        jsonTool({
            name: 'create_exchange_rate',
            description:
                'Record a new exchange rate observation. Returns the created exchange rate entry.',
            inputSchema: {
                type: 'object',
                properties: {
                    fromCurrency: { type: 'string', enum: CURRENCIES, description: 'Origin currency: ARS or USD' },
                    toCurrency: { type: 'string', enum: CURRENCIES, description: 'Target currency: ARS or USD' },
                    rate: { type: 'string', description: 'Exchange rate as a positive number string' },
                    type: { type: 'string', enum: EXCHANGE_RATE_TYPES, description: 'Rate type: official, blue, mep, or ccl' },
                    date: { type: 'string', description: 'Observation date (YYYY-MM-DD). Defaults to today.' },
                },
                required: ['fromCurrency', 'toCurrency', 'rate', 'type'],
            },
            execute: async (input) =>
                bus.execute(new CreateExchangeRateCommand({
                    fromCurrency: input.fromCurrency,
                    toCurrency: input.toCurrency,
                    rate: input.rate,
                    type: input.type,
                    date: input.date,
                }), executionContext()),
        }),
    ];
}
