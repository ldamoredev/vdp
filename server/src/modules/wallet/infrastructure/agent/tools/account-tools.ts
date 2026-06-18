import { CQBus } from '@nbottarini/cqbus';

import { executionContextFromAuth } from '../../../../common/app/auth/AuthExecutionContext';
import { ACCOUNT_TYPES, CURRENCIES, jsonTool } from './shared';
import { AuthContextStorage } from '../../../../common/http/AuthContextStorage';
import { CreateAccountCommand } from '../../../app/CreateAccountCommand';
import { GetAccountsQuery } from '../../../app/GetAccountsQuery';

export function createAccountTools(bus: CQBus, authContextStorage: AuthContextStorage) {
    const executionContext = () => executionContextFromAuth(authContextStorage.getAuthContext());

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
            execute: async () => bus.execute(new GetAccountsQuery(), executionContext()),
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
            execute: async (input) => {
                return bus.execute(new CreateAccountCommand({
                    name: input.name,
                    currency: input.currency,
                    type: input.type,
                    initialBalance: input.initialBalance,
                }), executionContext());
            },
        }),
    ];
}
