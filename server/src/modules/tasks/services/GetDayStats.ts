import { TaskRepository } from '../domain/TaskRepository';
import { todayISO, localDateISO } from '../../common/base/time/dates';

export type DayStats = {
    date: string;
    total: number;
    completed: number;
    pending: number;
    carriedOver: number;
    discarded: number;
    completionRate: number;
};

export class GetDayStats {
    constructor(private repository: TaskRepository) {}

    async execute(date: string): Promise<DayStats> {
        const dayTasks = await this.repository.getTasksByDate(date);

        const completed = dayTasks.filter((t) => t.status === "done").length;
        const carriedOver = dayTasks.filter((t) => t.carryOverCount > 0).length;
        const total = dayTasks.length;

        return {
            date,
            total,
            completed,
            pending: dayTasks.filter((t) => t.status === "pending").length,
            carriedOver,
            discarded: dayTasks.filter((t) => t.status === "discarded").length,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
    }

    async executeToday(): Promise<DayStats> {
        return this.execute(todayISO());
    }

    async executeTrend(days: number = 7): Promise<DayStats[]> {
        const date = new Date();
        const toDate = localDateISO(date);
        date.setDate(date.getDate() - (days - 1));
        const fromDate = localDateISO(date);

        const rows = await this.repository.getTrendByDateRange(fromDate, toDate);
        const rowMap = new Map(rows.map(r => [r.date, r]));

        // Fill in missing dates (days with zero tasks)
        const results: DayStats[] = [];
        const cursor = new Date(toDate + 'T12:00:00');
        for (let i = 0; i < days; i++) {
            const d = localDateISO(cursor);
            const row = rowMap.get(d);

            if (row) {
                results.push({
                    date: d,
                    total: row.total,
                    completed: row.completed,
                    pending: row.pending,
                    carriedOver: row.carriedOver,
                    discarded: row.discarded,
                    completionRate: row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0,
                });
            } else {
                results.push({
                    date: d,
                    total: 0,
                    completed: 0,
                    pending: 0,
                    carriedOver: 0,
                    discarded: 0,
                    completionRate: 0,
                });
            }

            cursor.setDate(cursor.getDate() - 1);
        }

        return results;
    }
}
