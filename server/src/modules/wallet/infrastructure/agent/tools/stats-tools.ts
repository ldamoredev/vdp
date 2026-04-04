import { ServiceProvider } from '../../../../common/base/services/ServiceProvider';
import { GetAccounts } from '../../../services/GetAccounts';
import { GetSpendingStats } from '../../../services/GetSpendingStats';
import { jsonTool } from './shared';
import { AuthContextStorage } from '../../../../common/auth/AuthContextStorage';

export function createStatsTools(services: ServiceProvider, authContextStorage: AuthContextStorage) {
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
                },
                required: [],
            },
            execute: async (input) => {
                const userId = authContextStorage.getRequestAuth().userId!;
                const accounts = await services.get(GetAccounts).execute(userId);
                if (input.accountId) {
                    const account = accounts.find((a) => a.id === input.accountId);
                    return account ?? { error: 'Account not found' };
                }
                const totalARS = accounts
                    .filter((a) => a.currency === 'ARS')
                    .reduce((sum, a) => sum + parseFloat(a.currentBalance), 0);
                const totalUSD = accounts
                    .filter((a) => a.currency === 'USD')
                    .reduce((sum, a) => sum + parseFloat(a.currentBalance), 0);
                return {
                    accounts,
                    totals: {
                        ARS: totalARS.toFixed(2),
                        USD: totalUSD.toFixed(2),
                    },
                };
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
                const userId = authContextStorage.getRequestAuth().userId!;
                return services.get(GetSpendingStats).executeSummary(userId, input.from, input.to);
            },
        }),
    ];
}
