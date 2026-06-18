import { CQBus } from '@nbottarini/cqbus';

import { executionContextFromAuth } from '../../../../common/app/auth/AuthExecutionContext';
import { CURRENCIES, INVESTMENT_TYPES, jsonTool } from './shared';
import { AuthContextStorage } from '../../../../common/http/AuthContextStorage';
import { CreateInvestmentCommand } from '../../../app/CreateInvestmentCommand';
import { GetInvestmentsQuery } from '../../../app/GetInvestmentsQuery';
import { UpdateInvestmentCommand } from '../../../app/UpdateInvestmentCommand';

export function createInvestmentTools(bus: CQBus, authContextStorage: AuthContextStorage) {
    const executionContext = () => executionContextFromAuth(authContextStorage.getAuthContext());

    return [
        jsonTool({
            name: 'list_investments',
            description:
                'List all investments with invested amount, current value, currency, dates, and active status.',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
            execute: async () => {
                return bus.execute(new GetInvestmentsQuery(), executionContext());
            },
        }),
        jsonTool({
            name: 'create_investment',
            description:
                'Create a new investment record. Returns the created investment.',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Investment name' },
                    type: { type: 'string', enum: INVESTMENT_TYPES, description: 'Investment type' },
                    accountId: { type: ['string', 'null'], description: 'Optional linked account ID' },
                    currency: { type: 'string', enum: CURRENCIES, description: 'Currency: ARS or USD' },
                    investedAmount: { type: 'string', description: 'Initial invested amount as a positive number string' },
                    currentValue: { type: 'string', description: 'Current valuation as a number string' },
                    startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                    endDate: { type: ['string', 'null'], description: 'Optional end date (YYYY-MM-DD)' },
                    rate: { type: ['string', 'null'], description: 'Optional rate or yield information' },
                    notes: { type: ['string', 'null'], description: 'Optional investment notes' },
                },
                required: ['name', 'type', 'currency', 'investedAmount', 'currentValue', 'startDate'],
            },
            execute: async (input) => {
                return bus.execute(new CreateInvestmentCommand({
                    name: input.name,
                    type: input.type,
                    accountId: input.accountId ?? null,
                    currency: input.currency,
                    investedAmount: input.investedAmount,
                    currentValue: input.currentValue,
                    startDate: input.startDate,
                    endDate: input.endDate ?? null,
                    rate: input.rate ?? null,
                    notes: input.notes ?? null,
                }), executionContext());
            },
        }),
        jsonTool({
            name: 'update_investment',
            description:
                'Update an existing investment record, such as its valuation, notes, dates, or linked account.',
            inputSchema: {
                type: 'object',
                properties: {
                    investmentId: { type: 'string', description: 'Investment ID' },
                    name: { type: 'string', description: 'Updated investment name' },
                    type: { type: 'string', enum: INVESTMENT_TYPES, description: 'Updated investment type' },
                    accountId: { type: ['string', 'null'], description: 'Updated linked account ID' },
                    currency: { type: 'string', enum: CURRENCIES, description: 'Updated currency' },
                    investedAmount: { type: 'string', description: 'Updated invested amount' },
                    currentValue: { type: 'string', description: 'Updated current value' },
                    startDate: { type: 'string', description: 'Updated start date (YYYY-MM-DD)' },
                    endDate: { type: ['string', 'null'], description: 'Updated end date (YYYY-MM-DD)' },
                    rate: { type: ['string', 'null'], description: 'Updated rate or yield information' },
                    notes: { type: ['string', 'null'], description: 'Updated notes' },
                },
                required: ['investmentId'],
            },
            execute: async (input) => {
                const investment = await bus.execute(new UpdateInvestmentCommand(input.investmentId, {
                    name: input.name,
                    type: input.type,
                    accountId: 'accountId' in input ? input.accountId : undefined,
                    currency: input.currency,
                    investedAmount: input.investedAmount,
                    currentValue: input.currentValue,
                    startDate: input.startDate,
                    endDate: 'endDate' in input ? input.endDate : undefined,
                    rate: 'rate' in input ? input.rate : undefined,
                    notes: 'notes' in input ? input.notes : undefined,
                }), executionContext());
                return investment ?? { error: 'Investment not found' };
            },
        }),
    ];
}
