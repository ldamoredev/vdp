import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { todayISO } from '../../common/base/time/dates';
import { TaskRepository } from '../domain/TaskRepository';
import { TaskInsightsSnapshot, TaskInsightsStore } from '../services/TaskInsightsStore';
import { CarryOverRate, DayStats, getCarryOverRate, getTodayStats, getTrendStats } from './task-stats';

export type PlanningContext = {
    today: DayStats;
    recentTrend: DayStats[];
    carryOverRate: CarryOverRate;
    stuckTasks: { id: string; title: string; carryOverCount: number }[];
    insights: TaskInsightsSnapshot;
    recommendations: string[];
};

export class GetPlanningContextQuery extends Query<PlanningContext> {}

export class GetPlanningContextQueryHandler implements RequestHandler<GetPlanningContextQuery, PlanningContext> {
    constructor(
        private readonly tasks: TaskRepository,
        private readonly insightsStore: TaskInsightsStore,
    ) {}

    async handle(_query: GetPlanningContextQuery, identity: Identity): Promise<PlanningContext> {
        const { userId } = requireUserIdentity(identity);
        const today = await getTodayStats(this.tasks, userId);
        const recentTrend = await getTrendStats(this.tasks, userId, 7);
        const carryOver = await getCarryOverRate(this.tasks, userId, 7);
        const insights = this.insightsStore.getSnapshot(userId);

        const pendingTasks = (await this.tasks.getTasksByDate(userId, todayISO()))
            .filter((task) => task.isOpen());
        const stuckTasks = pendingTasks
            .filter((task) => task.carryOverCount >= 3)
            .map((task) => ({ id: task.id, title: task.title, carryOverCount: task.carryOverCount }));

        const recommendations: string[] = [];

        if (carryOver.rate > 40) {
            recommendations.push(`Tu tasa de arrastre es alta (${carryOver.rate}%). Considerá planear menos tareas para mañana.`);
        }

        if (stuckTasks.length > 0) {
            recommendations.push(`Tenés ${stuckTasks.length} tareas estancadas. Recomendamos dividirlas en pasos más chicos o descartarlas.`);
        }

        if (today.completionRate >= 80 && today.total >= 3) {
            recommendations.push('¡Gran progreso hoy! Seguí así.');
        }

        return {
            today,
            recentTrend,
            carryOverRate: carryOver,
            stuckTasks,
            insights,
            recommendations,
        };
    }
}
