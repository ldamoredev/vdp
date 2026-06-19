import { CQBus, Identity } from '@nbottarini/cqbus';
import { describe, expect, it } from 'vitest';

import { AuthContext } from '../../../common/http/AuthContext';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';
import { GetTasksSnapshotQuery } from '../../../tasks/app/GetTasksSnapshotQuery';
import { GetAccountsQuery } from '../../app/GetAccountsQuery';
import { WalletTools } from '../../infrastructure/agent/tools';

const authContext: AuthContext = {
    isAuthenticated: true,
    userId: 'user-1',
    sessionId: 'session-1',
    role: 'user',
    email: 'test@example.com',
    displayName: 'Test User',
};

describe('WalletTools', () => {
    it('composes the wallet tool registry with accounts, transactions, stats, intelligence, savings, investments, and exchange rates', () => {
        const tools = WalletTools.createWalletTools(new CQBus(), new AuthContextStorage());

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

    it('executes wallet-owned tools through CQBus with the current auth identity', async () => {
        const bus = new CQBus();
        const identities: Identity[] = [];

        bus.registerHandler(GetAccountsQuery, () => ({
            handle: async (_query, identity) => {
                identities.push(identity);
                return [];
            },
        }));

        const authContextStorage = new AuthContextStorage();
        const getAccounts = WalletTools.createWalletTools(bus, authContextStorage)
            .find((tool) => tool.name === 'get_accounts')!;

        const result = await authContextStorage.runWithContext(authContext, () => getAccounts.execute({}));

        expect(JSON.parse(result)).toEqual([]);
        expect(identities).toHaveLength(1);
        expect(identities[0].properties.userId).toBe('user-1');
    });

    it('executes tasks context through CQBus with the current auth identity', async () => {
        const bus = new CQBus();
        const identities: Identity[] = [];

        bus.registerHandler(GetTasksSnapshotQuery, () => ({
            handle: async (_query, identity) => {
                identities.push(identity);
                return {
                    pendingCount: 2,
                    completedCount: 1,
                    totalCount: 3,
                    completionRate: 33,
                    stuckTasks: [{ title: 'Pay card', carryOverCount: 4 }],
                };
            },
        }));

        const authContextStorage = new AuthContextStorage();
        const getTasksContext = WalletTools.createWalletTools(bus, authContextStorage)
            .find((tool) => tool.name === 'get_tasks_context')!;

        const result = await authContextStorage.runWithContext(authContext, () => getTasksContext.execute({}));

        expect(JSON.parse(result)).toEqual({
            tasksContext: {
                pendingCount: 2,
                completedCount: 1,
                totalCount: 3,
                completionRate: 33,
                stuckTasks: [{ title: 'Pay card', carryOverCount: 4 }],
            },
        });
        expect(identities).toHaveLength(1);
        expect(identities[0].properties.userId).toBe('user-1');
    });
});
