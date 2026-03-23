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

    async execute(date?: string): Promise<DayReview> {
        const reviewDate = date || todayISO();
        const dayTasks = await this.repository.getTasksByDate(reviewDate);

        const completed = dayTasks.filter((t) => t.status === "done");
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
