import { AuthContextStorage } from '../../../../auth/infrastructure/http/AuthContextStorage';
import { ServiceProvider } from '../../../../common/base/services/ServiceProvider';
import { GetTasksSnapshot } from '../../../../tasks/services/GetTasksSnapshot';
import { GetCategoryTrends } from '../../../services/GetCategoryTrends';
import { GetSpendingAnomalies } from '../../../services/GetSpendingAnomalies';
import { jsonTool } from './shared';

const EMPTY_OBJECT_SCHEMA = {
    type: 'object',
    properties: {},
    required: [],
} as const;

export function createWalletIntelligenceTools(
    services: ServiceProvider,
    authContextStorage: AuthContextStorage,
) {
    return [
        jsonTool({
            name: 'get_spending_anomalies',
            description:
                'Detect unusual spending categories this week compared to the user’s recent baseline. ' +
                'Use this when the user asks about overspending, unusual expenses, or where to pay attention.',
            inputSchema: EMPTY_OBJECT_SCHEMA,
            execute: async () => {
                const userId = authContextStorage.getAuthContext().userId!;
                const anomalies = await services.get(GetSpendingAnomalies).execute(userId);

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
                const userId = authContextStorage.getAuthContext().userId!;
                const trends = await services.get(GetCategoryTrends).execute(userId);

                if (trends.length === 0) {
                    return { message: 'No category trends available yet.', trends: [] };
                }

                return { trends };
            },
        }),
    ];
}
