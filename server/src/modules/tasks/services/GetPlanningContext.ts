import { TaskRepository } from '../domain/TaskRepository';
import { GetDayStats, DayStats } from './GetDayStats';
import { GetCarryOverRate, CarryOverRate } from './GetCarryOverRate';
import { TaskInsightsStore, TaskInsightsSnapshot } from './TaskInsightsStore';
import { todayISO } from '../../common/base/time/dates';

export type PlanningContext = {
    today: DayStats;
    recentTrend: DayStats[];
    carryOverRate: CarryOverRate;
    stuckTasks: { id: string; title: string; carryOverCount: number }[];
    insights: TaskInsightsSnapshot;
    recommendations: string[];
};

export class GetPlanningContext {
    constructor(
        private repository: TaskRepository,
        private getDayStats: GetDayStats,
        private getCarryOverRate: GetCarryOverRate,
        private insightsStore: TaskInsightsStore,
    ) {}

    async execute(): Promise<PlanningContext> {
        const today = await this.getDayStats.executeToday();
        const recentTrend = await this.getDayStats.executeTrend(7);
        const carryOver = await this.getCarryOverRate.execute(7);
        const insights = this.insightsStore.getSnapshot();

        const pendingTasks = await this.repository.getTasksByDateAndStatus(todayISO(), 'pending');
        const stuckTasks = pendingTasks
            .filter(t => t.carryOverCount >= 3)
            .map(t => ({ id: t.id, title: t.title, carryOverCount: t.carryOverCount }));

        const recommendations: string[] = [];

        if (carryOver.rate > 40) {
            recommendations.push(`Tu tasa de arrastre es alta (${carryOver.rate}%). Considerá planear menos tareas para mañana.`);
        }

        if (stuckTasks.length > 0) {
            recommendations.push(`Tenés ${stuckTasks.length} tareas estancadas. Recomendamos dividirlas en pasos más chicos o descartarlas.`);
        }

        if (today.completionRate >= 80 && today.total >= 3) {
            recommendations.push("¡Gran progreso hoy! Seguí así.");
        }

        return {
            today,
            recentTrend,
            carryOverRate: carryOver,
            stuckTasks,
            insights,
            recommendations
        };
    }
}
