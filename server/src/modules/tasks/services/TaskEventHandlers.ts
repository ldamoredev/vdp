import { EventBus } from '../../common/base/event-bus/EventBus';
import { DomainEvent } from '../../common/base/event-bus/DomainEvent';
import { EventSubscriber } from '../../common/base/event-bus/EventSubscriber';
import { TaskInsightsStore } from './TaskInsightsStore';

/**
 * Handles all task domain events.
 * Each handler reacts to a specific event and performs side-effects:
 * - Tracks completion streaks (gamification)
 * - Generates proactive insights and suggestions
 * - Surfaces warnings for stuck/overloaded states
 *
 * Insights are stored in TaskInsightsStore and surfaced to the user
 * via the agent's `get_insights` tool.
 */
export class TaskEventHandlers implements EventSubscriber {
    constructor(
        private eventBus: EventBus,
        private insightsStore: TaskInsightsStore,
    ) {}

    subscribe(): void {
        this.eventBus.on("tasks.task.completed", this.onTaskCompleted.bind(this));
        this.eventBus.on("tasks.daily.all_completed", this.onDailyAllCompleted.bind(this));
        this.eventBus.on("tasks.task.stuck", this.onTaskStuck.bind(this));
        this.eventBus.on("tasks.overloaded", this.onTasksOverloaded.bind(this));
    }

    private async onTaskCompleted(event: DomainEvent): Promise<void> {
        const { taskId, scheduledDate } = event.payload as {
            taskId: string;
            scheduledDate: string;
        };

        console.log(`[TASKS] Tarea completada: ${taskId} (fecha: ${scheduledDate})`);

        this.insightsStore.addInsight(
            'achievement',
            'Tarea completada',
            `Completaste una tarea programada para ${scheduledDate}. ¡Seguí así!`,
            { taskId, scheduledDate },
        );
    }

    private async onDailyAllCompleted(event: DomainEvent): Promise<void> {
        const { date, count } = event.payload as {
            date: string;
            count: number;
        };

        console.log(`[TASKS] Todas las tareas del ${date} completadas (${count} tareas)`);

        // Update streak
        this.insightsStore.recordPerfectDay(date);
        const streak = this.insightsStore.getStreak();

        // Build achievement message based on streak milestone
        let title: string;
        let message: string;

        if (streak.current >= 7) {
            title = `🔥 Racha de ${streak.current} días`;
            message = `¡Impresionante! Completaste todas tus tareas ${streak.current} días seguidos. ` +
                `${count} tareas hoy. Tu mejor racha: ${streak.best} días.`;
        } else if (streak.current >= 3) {
            title = `⚡ Racha de ${streak.current} días`;
            message = `¡Vas muy bien! ${count} tareas completadas hoy. ` +
                `Llevás ${streak.current} días consecutivos. ¡No pares!`;
        } else {
            title = '✅ Día perfecto';
            message = `Completaste las ${count} tareas del ${date}. ` +
                (streak.current > 1
                    ? `Racha actual: ${streak.current} días seguidos.`
                    : `¡Empezá una racha completando todo mañana también!`);
        }

        this.insightsStore.addInsight('achievement', title, message, {
            date,
            count,
            streak: streak.current,
            bestStreak: streak.best,
        });
    }

    private async onTaskStuck(event: DomainEvent): Promise<void> {
        const { taskId, title, carryOverCount } = event.payload as {
            taskId: string;
            title: string;
            carryOverCount: number;
        };

        console.warn(`[TASKS] Tarea atascada: "${title}" (${carryOverCount} carry-overs). ID: ${taskId}`);

        // Actionable suggestions escalate with carry-over severity
        let suggestion: string;

        if (carryOverCount >= 5) {
            suggestion =
                `La tarea "${title}" fue postergada ${carryOverCount} veces. ` +
                `Considerá: (1) Descartarla si ya no es relevante, ` +
                `(2) Dividirla en sub-tareas más pequeñas, ` +
                `(3) Delegarla a alguien más. ` +
                `¿Querés que te ayude a decidir?`;
        } else {
            suggestion =
                `La tarea "${title}" fue postergada ${carryOverCount} veces. ` +
                `Tal vez sea muy grande o poco clara. ` +
                `¿Querés que te ayude a dividirla en pasos más concretos?`;
        }

        this.insightsStore.addInsight('suggestion', '🔄 Tarea atascada', suggestion, {
            taskId,
            title,
            carryOverCount,
        });
    }

    private async onTasksOverloaded(event: DomainEvent): Promise<void> {
        const { carryOverRate, period } = event.payload as {
            carryOverRate: number;
            period: string;
        };

        console.warn(`[TASKS] Sobrecarga detectada: ${carryOverRate}% carry-over en ${period}`);

        let message: string;

        if (carryOverRate >= 70) {
            message =
                `Sobrecarga alta: ${carryOverRate}% de tus tareas se están postergando (${period}). ` +
                `Estás planificando más de lo que podés ejecutar. ` +
                `Sugerencias: (1) Reducí la cantidad de tareas diarias, ` +
                `(2) Priorizá las 3 más importantes, ` +
                `(3) Descartá las que no aportan valor real.`;
        } else {
            message =
                `El ${carryOverRate}% de tus tareas se están postergando (${period}). ` +
                `Revisá si estás siendo realista con la planificación diaria. ` +
                `¿Querés que analice cuáles tareas se postergan más?`;
        }

        this.insightsStore.addInsight('warning', '📊 Sobrecarga detectada', message, {
            carryOverRate,
            period,
        });
    }
}
