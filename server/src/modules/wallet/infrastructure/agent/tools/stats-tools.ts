import { CQBus } from '@nbottarini/cqbus';

import { executionContextFromAuth } from '../../../../common/app/auth/AuthExecutionContext';
import { jsonTool } from './shared';
import { AuthContextStorage } from '../../../../common/http/AuthContextStorage';
import { GetSpendingSummaryQuery } from '../../../app/GetSpendingSummaryQuery';
import { GetWalletBalanceQuery } from '../../../app/GetWalletBalanceQuery';

export function createStatsTools(bus: CQBus, authContextStorage: AuthContextStorage) {
    const executionContext = () => executionContextFromAuth(authContextStorage.getAuthContext());

    return [
        jsonTool({
            name: 'get_balance',
            description:
                'Get the current balance across all accounts or a specific account. ' +
                'Returns accounts with their balances.',
            inputSchema: {
                type: 'object',
                properties: {
                    accountId: { type: 'string', description: 'Optional: specific account ID' },
                    currency: {
                        type: 'string',
                        enum: ['ARS', 'USD'],
                        description: 'Presentation currency for the consolidated balance. Default: ARS.',
                    },
                },
                required: [],
            },
            execute: async (input) => {
                return bus.execute(new GetWalletBalanceQuery(input.accountId, input.currency), executionContext());
            },
        }),
        jsonTool({
            name: 'spending_summary',
            description:
                'Get a spending summary for a date range. ' +
                'Returns total income, total expenses, net balance, and transaction count.',
            inputSchema: {
                type: 'object',
                properties: {
                    from: { type: 'string', description: 'Start date (YYYY-MM-DD). Default: first of current month.' },
                    to: { type: 'string', description: 'End date (YYYY-MM-DD). Default: today.' },
                },
                required: [],
            },
            execute: async (input) => {
                return bus.execute(new GetSpendingSummaryQuery(input.from, input.to), executionContext());
            },
        }),
    ];
}
