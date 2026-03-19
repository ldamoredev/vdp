import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';
import { todayISO } from '../../common/base/utils/dates';

export type DayReview = {
    date: string;
    total: number;
    completed: number;
    pending: number;
    carriedOver: number;
    discarded: number;
    completionRate: number;
    pendingTasks: Task[];
    allTasks: Task[];
};

export class GetEndOfDayReview {
    constructor(private repository: TaskRepository) {}

    async execute(date?: string): Promise<DayReview> {
        const reviewDate = date || todayISO();
        const dayTasks = await this.repository.getTasksByDate(reviewDate);

        const completed = dayTasks.filter((t) => t.status === "done");
        const pending = dayTasks.filter((t) => t.status === "pending");
        const carriedOver = dayTasks.filter((t) => t.status === "carried_over");
        const discarded = dayTasks.filter((t) => t.status === "discarded");

        return {
            date: reviewDate,
            total: dayTasks.length,
            completed: completed.length,
            pending: pending.length,
            carriedOver: carriedOver.length,
            discarded: discarded.length,
            completionRate: dayTasks.length > 0
                ? Math.round((completed.length / dayTasks.length) * 100)
                : 0,
            pendingTasks: pending,
            allTasks: dayTasks,
        };
    }
}
