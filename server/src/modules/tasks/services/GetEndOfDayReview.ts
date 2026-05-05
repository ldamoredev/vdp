import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';
import { todayISO } from '../../common/base/time/dates';
import { Recommendation, RecommendationEngine } from './RecommendationEngine';

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
    recommendations: Recommendation[];
};

export class GetEndOfDayReview {
    constructor(
        private repository: TaskRepository,
        private recommendationEngine: RecommendationEngine,
    ) {}

    async execute(userId: string, date?: string): Promise<DayReview> {
        const reviewDate = date || todayISO();
        const scheduledTasks = await this.repository.getTasksByDate(userId, reviewDate);
        const completedToday = await this.repository.getTasksCompletedOnDate(userId, reviewDate);
        const dayTasks = mergeUniqueTasks(scheduledTasks, completedToday);

        const completed = mergeUniqueTasks(
            scheduledTasks.filter((task) => task.status === 'done'),
            completedToday,
        );
        const pending = dayTasks.filter((t) => t.status === "pending");
        const carriedOver = dayTasks.filter((t) => t.carryOverCount > 0);
        const discarded = dayTasks.filter((t) => t.status === "discarded");

        const completionRate = dayTasks.length > 0
            ? Math.round((completed.length / dayTasks.length) * 100)
            : 0;

        const recommendations = this.recommendationEngine.getRecommendations(
            dayTasks,
            pending,
            completionRate,
        );

        return {
            date: reviewDate,
            total: dayTasks.length,
            completed: completed.length,
            pending: pending.length,
            carriedOver: carriedOver.length,
            discarded: discarded.length,
            completionRate,
            pendingTasks: pending,
            allTasks: dayTasks,
            recommendations,
        };
    }
}

function mergeUniqueTasks(...collections: Task[][]): Task[] {
    const merged = new Map<string, Task>();

    for (const tasks of collections) {
        for (const task of tasks) {
            merged.set(task.id, task);
        }
    }

    return Array.from(merged.values());
}
