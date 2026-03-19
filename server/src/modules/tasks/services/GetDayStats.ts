import { TaskRepository } from '../domain/TaskRepository';

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
        const total = dayTasks.length;

        return {
            date,
            total,
            completed,
            pending: dayTasks.filter((t) => t.status === "pending").length,
            carriedOver: dayTasks.filter((t) => t.status === "carried_over").length,
            discarded: dayTasks.filter((t) => t.status === "discarded").length,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
    }

    async executeToday(): Promise<DayStats> {
        return this.execute(new Date().toISOString().slice(0, 10));
    }

    async executeTrend(days: number = 7): Promise<DayStats[]> {
        const results: DayStats[] = [];
        const date = new Date();

        for (let i = 0; i < days; i++) {
            const dateStr = date.toISOString().slice(0, 10);
            results.push(await this.execute(dateStr));
            date.setDate(date.getDate() - 1);
        }

        return results;
    }
}
