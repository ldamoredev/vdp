import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { todayISO } from '../../common/base/time/dates';
import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';
import { Recommendation, RecommendationEngine } from '../services/RecommendationEngine';
import { mergeUniqueTasks } from './task-stats';

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

export class GetEndOfDayReviewQuery extends Query<DayReview> {
    constructor(readonly date?: string) {
        super();
    }
}

export class GetEndOfDayReviewQueryHandler implements RequestHandler<GetEndOfDayReviewQuery, DayReview> {
    constructor(
        private readonly tasks: TaskRepository,
        private readonly recommendationEngine: RecommendationEngine,
    ) {}

    async handle(query: GetEndOfDayReviewQuery, identity: Identity): Promise<DayReview> {
        const { userId } = requireUserIdentity(identity);
        const reviewDate = query.date || todayISO();
        const scheduledTasks = await this.tasks.getTasksByDate(userId, reviewDate);
        const completedToday = await this.tasks.getTasksCompletedOnDate(userId, reviewDate);
        const dayTasks = mergeUniqueTasks(scheduledTasks, completedToday);

        const completed = mergeUniqueTasks(
            scheduledTasks.filter((task) => task.status === 'done'),
            completedToday,
        );
        const pending = dayTasks.filter((task) => task.isOpen());
        const carriedOver = dayTasks.filter((task) => task.carryOverCount > 0);
        const discarded = dayTasks.filter((task) => task.status === 'discarded');

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
