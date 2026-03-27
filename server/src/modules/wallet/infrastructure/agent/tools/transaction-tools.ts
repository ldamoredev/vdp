import { ServiceProvider } from '../../../../common/base/services/ServiceProvider';
import { todayISO } from '../../../../common/base/time/dates';
import { GetTransactions } from '../../../services/GetTransactions';
import { CreateTransaction } from '../../../services/CreateTransaction';
import { CURRENCIES, TRANSACTION_TYPES, jsonTool } from './shared';

export function createTransactionTools(services: ServiceProvider) {
    return [
        jsonTool({
            name: 'list_transactions',
            description:
                'List transactions with optional filters. ' +
                'Supports filtering by account, category, type, date range, and search text.',
            inputSchema: {
                type: 'object',
                properties: {
                    accountId: { type: 'string', description: 'Filter by account ID' },
                    categoryId: { type: 'string', description: 'Filter by category ID' },
                    type: { type: 'string', enum: TRANSACTION_TYPES, description: 'Filter by type' },
                    from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                    to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
                    search: { type: 'string', description: 'Search in description' },
                    limit: { type: 'number', description: 'Max results. Default: 50' },
                },
                required: [],
            },
            execute: async (input) =>
                services.get(GetTransactions).execute({
                    accountId: input.accountId,
                    categoryId: input.categoryId,
                    type: input.type,
                    from: input.from,
                    to: input.to,
                    search: input.search,
                    limit: input.limit ?? 50,
                    offset: 0,
                }),
        }),
        jsonTool({
            name: 'log_transaction',
            description:
                'Log a new financial transaction (income, expense, or transfer between accounts). ' +
                'Returns the created transaction.',
            inputSchema: {
                type: 'object',
                properties: {
                    accountId: { type: 'string', description: 'Account ID for this transaction' },
                    type: { type: 'string', enum: TRANSACTION_TYPES, description: 'Transaction type' },
                    amount: { type: 'string', description: 'Amount (positive number as string, e.g., "1500.00")' },
                    currency: { type: 'string', enum: CURRENCIES, description: 'Currency: ARS or USD' },
                    description: { type: 'string', description: 'What this transaction is for' },
                    date: { type: 'string', description: 'Date (YYYY-MM-DD). Defaults to today.' },
                    categoryId: { type: 'string', description: 'Category ID (optional)' },
                    transferToAccountId: { type: 'string', description: 'Target account for transfers' },
                    tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
                },
                required: ['accountId', 'type', 'amount', 'currency'],
            },
            execute: async (input) =>
                services.get(CreateTransaction).execute({
                    accountId: input.accountId,
                    type: input.type,
                    amount: input.amount,
                    currency: input.currency,
                    description: input.description ?? null,
                    date: input.date ?? todayISO(),
                    categoryId: input.categoryId ?? null,
                    transferToAccountId: input.transferToAccountId ?? null,
                    tags: input.tags ?? [],
                }),
        }),
    ];
}
