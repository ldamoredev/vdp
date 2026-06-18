import { CQBus } from '@nbottarini/cqbus';
import { executionContextFromAuth } from '../../../../common/app/auth/AuthExecutionContext';
import { GetEndOfDayReviewQuery } from '../../../app/GetEndOfDayReviewQuery';
import { GetTodayStatsQuery } from '../../../app/GetTodayStatsQuery';
import { GetTrendStatsQuery } from '../../../app/GetTrendStatsQuery';
import { EMPTY_OBJECT_SCHEMA, invalidDateError, jsonTool } from './shared';
import { AuthContextStorage } from '../../../../common/http/AuthContextStorage';

export function createTaskReviewTools(bus: CQBus, authContextStorage: AuthContextStorage) {
    const executionContext = () => executionContextFromAuth(authContextStorage.getAuthContext());

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
                const dateError = invalidDateError(input, ['date']);
                if (dateError) return dateError;

                return bus.execute(new GetEndOfDayReviewQuery(input.date), executionContext());
            },
        }),
        jsonTool({
            name: 'get_today_stats',
            description:
                "Get today's task stats: completed, pending, completion rate. Useful when helping the user plan the day or assess load.",
            inputSchema: EMPTY_OBJECT_SCHEMA,
            execute: async () => {
                return bus.execute(new GetTodayStatsQuery(), executionContext());
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
                return bus.execute(new GetTrendStatsQuery(input.days || 7), executionContext());
            },
        }),
    ];
}
