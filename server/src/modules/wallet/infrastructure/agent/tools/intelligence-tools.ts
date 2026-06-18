import { CQBus } from '@nbottarini/cqbus';

import { executionContextFromAuth } from '../../../../common/app/auth/AuthExecutionContext';
import { AuthContextStorage } from '../../../../common/http/AuthContextStorage';
import { ServiceProvider } from '../../../../common/base/services/ServiceProvider';
import { GetTasksSnapshot } from '../../../../tasks/services/GetTasksSnapshot';
import { GetCategoryTrendsQuery } from '../../../app/GetCategoryTrendsQuery';
import { GetSpendingAnomaliesQuery } from '../../../app/GetSpendingAnomaliesQuery';
import { jsonTool } from './shared';

const EMPTY_OBJECT_SCHEMA = {
    type: 'object',
    properties: {},
    required: [],
} as const;

export function createWalletIntelligenceTools(
    bus: CQBus,
    services: ServiceProvider,
    authContextStorage: AuthContextStorage,
) {
    const executionContext = () => executionContextFromAuth(authContextStorage.getAuthContext());

    return [
        jsonTool({
            name: 'get_spending_anomalies',
            description:
                'Detect unusual spending categories this week compared to the user’s recent baseline. ' +
                'Use this when the user asks about overspending, unusual expenses, or where to pay attention.',
            inputSchema: EMPTY_OBJECT_SCHEMA,
            execute: async () => {
                const anomalies = await bus.execute(new GetSpendingAnomaliesQuery(), executionContext());

                if (anomalies.length === 0) {
                    return { message: 'No spending anomalies detected this week.', anomalies: [] };
                }

                return { anomalies };
            },
        }),
        jsonTool({
            name: 'get_tasks_context',
            description:
                'Get a compact snapshot of today’s task state, including pending work, completion rate, and stuck tasks. ' +
                'Use this when a spending pattern might connect to the user’s workload.',
            inputSchema: EMPTY_OBJECT_SCHEMA,
            execute: async () => {
                const userId = authContextStorage.getAuthContext().userId!;
                return {
                    tasksContext: await services.get(GetTasksSnapshot).execute(userId),
                };
            },
        }),
        jsonTool({
            name: 'get_category_trends',
            description:
                'Compare this week versus last week by category and label each trend as up, down, or stable. ' +
                'Use this when the user asks how their spending is evolving.',
            inputSchema: EMPTY_OBJECT_SCHEMA,
            execute: async () => {
                const trends = await bus.execute(new GetCategoryTrendsQuery(), executionContext());

                if (trends.length === 0) {
                    return { message: 'No category trends available yet.', trends: [] };
                }

                return { trends };
            },
        }),
    ];
}
