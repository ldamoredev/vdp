import { CQBus } from '@nbottarini/cqbus';
import { executionContextFromAuth } from '../../../../common/app/auth/AuthExecutionContext';
import { GetWalletSnapshotQuery } from '../../../../wallet/app/GetWalletSnapshotQuery';
import { FindSimilarTasksQuery } from '../../../app/FindSimilarTasksQuery';
import { GetEndOfDayReviewQuery } from '../../../app/GetEndOfDayReviewQuery';
import { GetPlanningContextQuery } from '../../../app/GetPlanningContextQuery';
import { GetWeeklySummaryQuery } from '../../../app/GetWeeklySummaryQuery';
import { invalidDateError, jsonTool } from './shared';
import { AuthContextStorage } from '../../../../common/http/AuthContextStorage';

export function createTaskIntelligenceTools(bus: CQBus, authContextStorage: AuthContextStorage) {
    const executionContext = () => executionContextFromAuth(authContextStorage.getAuthContext());

    return [
        jsonTool({
            name: 'find_similar_tasks',
            description:
                'Search for tasks similar to a query using semantic embeddings. ' +
                'Use this before creating a task to check for duplicates, or when the user asks about related/past tasks.',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Text to search for similar tasks (e.g. a task title or description)',
                    },
                    limit: {
                        type: 'number',
                        description: 'Max results to return (default: 5)',
                    },
                },
                required: ['query'],
            },
            execute: async (input) => {
                const results = await bus.execute(new FindSimilarTasksQuery(input.query, input.limit), executionContext());

                if (results.length === 0) {
                    return { message: 'No similar tasks found', results: [] };
                }

                return { count: results.length, results };
            },
        }),
        jsonTool({
            name: 'get_planning_context',
            description:
                'Get an aggregated view of the day stats, recent trends, carry-over rate, stuck tasks, and proactive insights. ' +
                'Use this when the user asks for planning help, a daily summary, or when starting a new day.',
            inputSchema: { type: 'object', properties: {} },
            execute: async () => {
                return bus.execute(new GetPlanningContextQuery(), executionContext());
            },
        }),
        jsonTool({
            name: 'get_wallet_context',
            description:
                'Get a compact wallet snapshot for today: income, expenses, top categories, and anomalies. ' +
                'Use this when the user mentions money or when cross-domain context could help.',
            inputSchema: { type: 'object', properties: {} },
            execute: async () => {
                return {
                    walletContext: await bus.execute(new GetWalletSnapshotQuery(), executionContext()),
                };
            },
        }),
        jsonTool({
            name: 'get_weekly_summary',
            description:
                'Get a detailed weekly productivity report (last 7 days by default). ' +
                'Includes completion rate, trends, best day, and most active domain.',
            inputSchema: {
                type: 'object',
                properties: {
                    days: { type: 'number', description: 'Number of days to summarize (default: 7)' },
                },
            },
            execute: async (input) => {
                return bus.execute(new GetWeeklySummaryQuery(input.days), executionContext());
            },
        }),
        jsonTool({
            name: 'get_recommendations',
            description:
                'Get actionable recommendations for the day based on completion rate, pending tasks, and carry-over patterns. ' +
                'Returns typed recommendations: celebrate, reschedule, break_down, or discard. ' +
                'Use this at the end of the day or when the user asks for advice on what to do with pending tasks.',
            inputSchema: {
                type: 'object',
                properties: {
                    date: { type: 'string', description: 'Date in YYYY-MM-DD format (default: today)' },
                },
            },
            execute: async (input) => {
                const dateError = invalidDateError(input, ['date']);
                if (dateError) return dateError;

                const review = await bus.execute(new GetEndOfDayReviewQuery(input.date), executionContext());
                return {
                    date: review.date,
                    completionRate: review.completionRate,
                    pending: review.pending,
                    recommendations: review.recommendations,
                };
            },
        }),
    ];
}
