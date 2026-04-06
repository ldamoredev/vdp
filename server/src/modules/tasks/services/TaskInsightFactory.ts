import { InsightType, NewInsight, StreakData } from './TaskInsightsStore';
import { TaskCompletedPayload } from '../domain/events/TaskCompleted';
import { DailyAllCompletedPayload } from '../domain/events/DailyAllCompleted';
import { TaskStuckPayload } from '../domain/events/TaskStuck';
import { TasksOverloadedPayload } from '../domain/events/TasksOverloaded';
import { TaskRepeatDetectedPayload } from '../domain/events/TaskRepeatDetected';

export type {
    TaskCompletedPayload,
    DailyAllCompletedPayload,
    TaskStuckPayload,
    TasksOverloadedPayload,
    TaskRepeatDetectedPayload,
};

export class TaskInsightFactory {
    static taskCompleted(payload: TaskCompletedPayload): NewInsight {
        return this.buildInsight(
            payload.userId,
            'achievement',
            'Tarea completada',
            `Completaste una tarea programada para ${payload.scheduledDate}. ¡Seguí así!`,
            payload,
        );
    }

    static dailyAllCompleted(
        payload: DailyAllCompletedPayload,
        streak: StreakData,
    ): NewInsight {
        if (streak.current >= 7) {
            return this.buildInsight(
                payload.userId,
                'achievement',
                `🔥 Racha de ${streak.current} días`,
                `¡Impresionante! Completaste todas tus tareas ${streak.current} días seguidos. ` +
                    `${payload.count} tareas hoy. Tu mejor racha: ${streak.best} días.`,
                {
                    ...payload,
                    streak: streak.current,
                    bestStreak: streak.best,
                },
            );
        }

        if (streak.current >= 3) {
            return this.buildInsight(
                payload.userId,
                'achievement',
                `⚡ Racha de ${streak.current} días`,
                `¡Vas muy bien! ${payload.count} tareas completadas hoy. ` +
                    `Llevás ${streak.current} días consecutivos. ¡No pares!`,
                {
                    ...payload,
                    streak: streak.current,
                    bestStreak: streak.best,
                },
            );
        }

        return this.buildInsight(
            payload.userId,
            'achievement',
            '✅ Día perfecto',
            `Completaste las ${payload.count} tareas del ${payload.date}. ` +
                (streak.current > 1
                    ? `Racha actual: ${streak.current} días seguidos.`
                    : '¡Empezá una racha completando todo mañana también!'),
            {
                ...payload,
                streak: streak.current,
                bestStreak: streak.best,
            },
        );
    }

    static taskStuck(payload: TaskStuckPayload): NewInsight {
        const message = payload.carryOverCount >= 5
            ? `La tarea "${payload.title}" fue postergada ${payload.carryOverCount} veces. ` +
                `Considerá: (1) Descartarla si ya no es relevante, ` +
                `(2) Dividirla en sub-tareas más pequeñas, ` +
                `(3) Delegarla a alguien más. ` +
                `¿Querés que te ayude a decidir?`
            : `La tarea "${payload.title}" fue postergada ${payload.carryOverCount} veces. ` +
                `Tal vez sea muy grande o poco clara. ` +
                `¿Querés que te ayude a dividirla en pasos más concretos?`;

        return this.buildInsight(payload.userId, 'suggestion', '🔄 Tarea atascada', message, payload);
    }

    static taskRepeatDetected(payload: TaskRepeatDetectedPayload): NewInsight {
        const patternMessages: Record<string, string> = {
            habitual_discard:
                `La tarea "${payload.title}" se parece a ${payload.previousInstances} tareas anteriores que fueron descartadas. ` +
                `Este patrón sugiere que este tipo de tarea se crea pero nunca se completa. ` +
                `¿Realmente la necesitás o es mejor eliminarla de tu flujo?`,
            frequent_recreation:
                `La tarea "${payload.title}" es similar a ${payload.previousInstances} tareas anteriores que ya completaste. ` +
                `Podrías considerar convertirla en una tarea recurrente o crear una rutina para ella.`,
            stuck_pattern:
                `La tarea "${payload.title}" sigue un patrón de estancamiento similar a ${payload.previousInstances} tareas previas. ` +
                `Considerá dividirla en pasos más pequeños o replantear el enfoque.`,
        };

        const message = patternMessages[payload.pattern] ||
            `Se detectó un patrón repetido ("${payload.pattern}") en la tarea "${payload.title}" con ${payload.previousInstances} instancias previas.`;

        return this.buildInsight(payload.userId, 'suggestion', '🔁 Patrón repetido detectado', message, payload);
    }

    static tasksOverloaded(payload: TasksOverloadedPayload): NewInsight {
        const message = payload.carryOverRate >= 70
            ? `Sobrecarga alta: ${payload.carryOverRate}% de tus tareas se están postergando (${payload.period}). ` +
                `Estás planificando más de lo que podés ejecutar. ` +
                `Sugerencias: (1) Reducí la cantidad de tareas diarias, ` +
                `(2) Priorizá las 3 más importantes, ` +
                `(3) Descartá las que no aportan valor real.`
            : `El ${payload.carryOverRate}% de tus tareas se están postergando (${payload.period}). ` +
                `Revisá si estás siendo realista con la planificación diaria. ` +
                `¿Querés que analice cuáles tareas se postergan más?`;

        return this.buildInsight(payload.userId, 'warning', '📊 Sobrecarga detectada', message, payload);
    }

    private static buildInsight(
        userId: string,
        type: InsightType,
        title: string,
        message: string,
        metadata?: Record<string, unknown>,
    ): NewInsight {
        return { userId, type, title, message, metadata };
    }
}
