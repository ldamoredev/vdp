import { ServiceProvider } from '../../../../common/base/services/ServiceProvider';
import { GetCarryOverRate } from '../../../services/GetCarryOverRate';
import { GetCompletionByDomain } from '../../../services/GetCompletionByDomain';
import { GetDayStats } from '../../../services/GetDayStats';
import { GetEndOfDayReview } from '../../../services/GetEndOfDayReview';
import { EMPTY_OBJECT_SCHEMA, jsonTool } from './shared';

export function createTaskReviewTools(services: ServiceProvider) {
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
            execute: async (input) => services.get(GetEndOfDayReview).execute(input.date),
        }),
        jsonTool({
            name: 'get_today_stats',
            description:
                "Get today's task stats: completed, pending, completion rate. Useful when helping the user plan the day or assess load.",
            inputSchema: EMPTY_OBJECT_SCHEMA,
            execute: async () => services.get(GetDayStats).executeToday(),
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
            execute: async (input) => services.get(GetDayStats).executeTrend(input.days || 7),
        }),
        jsonTool({
            name: 'get_weekly_summary',
            description:
                'Get a comprehensive weekly summary: daily completion trend, domain breakdown, and carry-over rate. ' +
                'Use this when the user asks for a weekly review, retrospective, or wants to see how their week went.',
            inputSchema: {
                type: 'object',
                properties: {
                    days: { type: 'number', description: 'Number of days to summarize (default: 7)' },
                },
                required: [],
            },
            execute: async (input) => buildWeeklySummary(services, input.days || 7),
        }),
    ];
}

async function buildWeeklySummary(
    services: ServiceProvider,
    days: number,
): Promise<Record<string, unknown>> {
    const [trend, domains, carryOver] = await Promise.all([
        services.get(GetDayStats).executeTrend(days),
        services.get(GetCompletionByDomain).execute(),
        services.get(GetCarryOverRate).execute(days),
    ]);

    const totalTasks = trend.reduce((sum, day) => sum + day.total, 0);
    const totalCompleted = trend.reduce((sum, day) => sum + day.completed, 0);
    const avgCompletionRate = totalTasks > 0
        ? Math.round((totalCompleted / totalTasks) * 100)
        : 0;
    const bestDay = trend.reduce(
        (best, day) => (day.completionRate > best.completionRate ? day : best),
        trend[0],
    );
    const worstDay = trend.reduce(
        (worst, day) => (day.completionRate < worst.completionRate ? day : worst),
        trend[0],
    );

    return {
        period: { days, totalTasks, totalCompleted, avgCompletionRate },
        highlights: {
            bestDay: bestDay ? { date: bestDay.date, rate: bestDay.completionRate } : null,
            worstDay: worstDay ? { date: worstDay.date, rate: worstDay.completionRate } : null,
        },
        carryOver,
        domainBreakdown: domains,
        dailyTrend: trend,
    };
}
