import { ServiceProvider } from '../../../../common/base/services/ServiceProvider';
import { GetCarryOverRate } from '../../../services/GetCarryOverRate';
import { GetCompletionByDomain } from '../../../services/GetCompletionByDomain';
import { GetDayStats } from '../../../services/GetDayStats';
import { GetEndOfDayReview } from '../../../services/GetEndOfDayReview';
import { EMPTY_OBJECT_SCHEMA, jsonTool } from './shared';
import { AuthContextStorage } from '../../../../auth/infrastructure/http/AuthContextStorage';

export function createTaskReviewTools(services: ServiceProvider, authContextStorage: AuthContextStorage) {
    return [
        jsonTool({
            name: 'get_end_of_day_review',
            description:
                'Get end-of-day review: completed, pending, completion rate. Shows pending tasks for carry-over/discard. ' +
                'Use this when the user asks to close, review, or clean up the day.',
            inputSchema: {
                type: 'object',
                properties: {
                    date: { type: 'string', description: 'Date (YYYY-MM-DD). Default: today.' },
                },
                required: [],
            },
            execute: async (input) => {
                const userId = authContextStorage.getAuthContext().userId!;
                return services.get(GetEndOfDayReview).execute(userId, input.date);
            },
        }),
        jsonTool({
            name: 'get_today_stats',
            description:
                "Get today's task stats: completed, pending, completion rate. Useful when helping the user plan the day or assess load.",
            inputSchema: EMPTY_OBJECT_SCHEMA,
            execute: async () => {
                const userId = authContextStorage.getAuthContext().userId!;
                return services.get(GetDayStats).executeToday(userId);
            },
        }),
        jsonTool({
            name: 'get_completion_trend',
            description:
                'Get daily completion rates for the last N days (default 7). Use this when planning or reviewing to detect overload or carry-over patterns.',
            inputSchema: {
                type: 'object',
                properties: {
                    days: { type: 'number', description: 'Number of days (default 7, max 90)' },
                },
                required: [],
            },
            execute: async (input) => {
                const userId = authContextStorage.getAuthContext().userId!;
                return services.get(GetDayStats).executeTrend(userId, input.days || 7);
            },
        }),
    ];
}
