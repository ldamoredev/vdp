import { ServiceProvider } from '../../../../common/base/services/ServiceProvider';
import { GetAccounts } from '../../../services/GetAccounts';
import { CreateAccount } from '../../../services/CreateAccount';
import { ACCOUNT_TYPES, CURRENCIES, jsonTool } from './shared';

export function createAccountTools(services: ServiceProvider) {
    return [
        jsonTool({
            name: 'get_accounts',
            description:
                'List all wallet accounts with their current balances. ' +
                'Returns accounts including calculated current balance (initial + transactions).',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
            execute: async () => services.get(GetAccounts).execute(),
        }),
        jsonTool({
            name: 'create_account',
            description:
                'Create a new wallet account (bank, cash, crypto, or investment). ' +
                'Returns the created account.',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Account name (e.g., "Brubank", "Efectivo")' },
                    currency: { type: 'string', enum: CURRENCIES, description: 'Currency: ARS or USD' },
                    type: { type: 'string', enum: ACCOUNT_TYPES, description: 'Account type' },
                    initialBalance: { type: 'string', description: 'Initial balance. Default: "0"' },
                },
                required: ['name', 'currency', 'type'],
            },
            execute: async (input) =>
                services.get(CreateAccount).execute({
                    name: input.name,
                    currency: input.currency,
                    type: input.type,
                    initialBalance: input.initialBalance,
                }),
        }),
    ];
}
