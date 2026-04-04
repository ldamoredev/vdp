import { TaskRepository } from '../domain/TaskRepository';
import { GetDayStats, DayStats } from './GetDayStats';
import { localDateISO, todayISO } from '../../common/base/time/dates';

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

export class GetWeeklySummary {
    constructor(
        private repository: TaskRepository,
        private getDayStats: GetDayStats,
    ) {}

    async execute(userId: string, days: number = 7): Promise<WeeklySummary> {
        const dailyStats = await this.getDayStats.executeTrend(userId, days);
        
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

        const domainStats = await this.repository.getCompletionByDomain(userId, fromStr, toStr);
        // Heuristic: the domain with the most tasks is the focus area (or potential "worst" if it has low completion, 
        // but for now we just return the most active one).
        const worstDomain = domainStats.length > 0 
            ? domainStats.sort((a, b) => b.count - a.count)[0].domain 
            : null;

        return {
            totalTasks,
            completedTasks,
            completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            averageCompletionPerDay: Math.round((completedTasks / days) * 10) / 10,
            carryOverRate: totalTasks > 0 ? Math.round((totalCarriedOver / totalTasks) * 100) : 0,
            bestDay,
            worstDomain,
            days: dailyStats
        };
    }
}
