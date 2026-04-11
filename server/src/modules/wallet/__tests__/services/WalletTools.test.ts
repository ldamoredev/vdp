import { describe, expect, it } from 'vitest';

import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { AuthContextStorage } from '../../../auth/infrastructure/http/AuthContextStorage';
import { WalletTools } from '../../infrastructure/agent/tools';

describe('WalletTools', () => {
    it('composes the wallet tool registry with accounts, transactions, stats, intelligence, savings, investments, and exchange rates', () => {
        const tools = WalletTools.createWalletTools(new ServiceProvider(), new AuthContextStorage());

        expect(tools.map((tool) => tool.name)).toEqual([
            'get_accounts',
            'create_account',
            'list_transactions',
            'log_transaction',
            'get_balance',
            'spending_summary',
            'get_spending_anomalies',
            'get_tasks_context',
            'get_category_trends',
            'list_savings_goals',
            'create_savings_goal',
            'update_savings_goal',
            'contribute_savings',
            'list_investments',
            'create_investment',
            'update_investment',
            'get_exchange_rates',
            'create_exchange_rate',
        ]);
    });
});
