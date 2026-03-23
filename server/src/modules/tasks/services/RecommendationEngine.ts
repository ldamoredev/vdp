import { Task } from '../domain/Task';

export type RecommendationType = 'discard' | 'break_down' | 'reschedule' | 'celebrate';

export type Recommendation = {
    type: RecommendationType;
    taskId?: string;
    title?: string;
    reason: string;
    action: string;
};

export class RecommendationEngine {
    getRecommendations(allTasksForDay: Task[], pendingTasks: Task[], completionRate: number): Recommendation[] {
        const recommendations: Recommendation[] = [];

        // Completion Rate Based
        if (completionRate >= 80 && allTasksForDay.length >= 3 && pendingTasks.length === 0) {
            recommendations.push({
                type: 'celebrate',
                reason: '¡Día impecable! Completaste todas tus tareas del día.',
                action: 'Disfrutá del descanso y arrancá mañana con la misma energía.'
            });
        } else if (completionRate < 50 && pendingTasks.length > 5) {
            recommendations.push({
                type: 'reschedule',
                reason: 'Hoy fue un día con baja completación (< 50%) y mucha carga pendiente.',
                action: 'Considerá reprogramar lo que no sea urgente para evitar el agotamiento.'
            });
        }

        // Task Specific Based
        for (const task of pendingTasks) {
            if (task.carryOverCount >= 3) {
                recommendations.push({
                    type: 'break_down',
                    taskId: task.id,
                    title: task.title,
                    reason: `Esta tarea se arrastró ${task.carryOverCount} veces.`,
                    action: 'Sugerimos dividirla en pasos más chicos (sub-tareas) con la herramienta add_task_note.'
                });
            } else if (task.carryOverCount >= 2 && task.priority === 1) {
                recommendations.push({
                    type: 'discard',
                    taskId: task.id,
                    title: task.title,
                    reason: 'Es una tarea de baja prioridad que ya se arrastró varias veces.',
                    action: 'Si ya no es relevante, considerá descartarla para limpiar tu lista.'
                });
            }
        }

        return recommendations;
    }
}
