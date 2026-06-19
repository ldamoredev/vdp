import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { localDateISO, todayISO } from '../../common/base/time/dates';
import { TaskRepository } from '../domain/TaskRepository';
import { DayStats, getTrendStats } from './task-stats';

export type WeeklySummary = {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    averageCompletionPerDay: number;
    carryOverRate: number;
    bestDay: { date: string; completionRate: number };
    worstDomain: string | null;
    days: DayStats[];
};

export class GetWeeklySummaryQuery extends Query<WeeklySummary> {
    constructor(readonly days?: number) {
        super();
    }
}

export class GetWeeklySummaryQueryHandler implements RequestHandler<GetWeeklySummaryQuery, WeeklySummary> {
    constructor(private readonly tasks: TaskRepository) {}

    async handle(query: GetWeeklySummaryQuery, identity: Identity): Promise<WeeklySummary> {
        const { userId } = requireUserIdentity(identity);
        const days = query.days ?? 7;
        const dailyStats = await getTrendStats(this.tasks, userId, days);

        let totalTasks = 0;
        let completedTasks = 0;
        let totalCarriedOver = 0;
        let bestDay = { date: '', completionRate: -1 };

        for (const day of dailyStats) {
            totalTasks += day.total;
            completedTasks += day.completed;
            totalCarriedOver += day.carriedOver;

            if (day.completionRate > bestDay.completionRate) {
                bestDay = { date: day.date, completionRate: day.completionRate };
            }
        }

        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        const fromStr = localDateISO(fromDate);
        const toStr = todayISO();

        const domainStats = await this.tasks.getCompletionByDomain(userId, fromStr, toStr);
        const worstDomain = domainStats.length > 0
            ? [...domainStats].sort((a, b) => b.count - a.count)[0].domain
            : null;

        return {
            totalTasks,
            completedTasks,
            completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            averageCompletionPerDay: Math.round((completedTasks / days) * 10) / 10,
            carryOverRate: totalTasks > 0 ? Math.round((totalCarriedOver / totalTasks) * 100) : 0,
            bestDay,
            worstDomain,
            days: dailyStats,
        };
    }
}
