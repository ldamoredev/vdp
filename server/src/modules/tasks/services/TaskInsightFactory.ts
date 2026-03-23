import { InsightType, NewInsight, StreakData } from './TaskInsightsStore';

export type TaskCompletedPayload = {
    taskId: string;
    scheduledDate: string;
};

export type DailyAllCompletedPayload = {
    date: string;
    count: number;
};

export type TaskStuckPayload = {
    taskId: string;
    title: string;
    carryOverCount: number;
};

export type TasksOverloadedPayload = {
    carryOverRate: number;
    period: string;
};

export class TaskInsightFactory {
    static taskCompleted(payload: TaskCompletedPayload): NewInsight {
        return this.buildInsight(
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

        return this.buildInsight('suggestion', '🔄 Tarea atascada', message, payload);
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

        return this.buildInsight('warning', '📊 Sobrecarga detectada', message, payload);
    }

    private static buildInsight(
        type: InsightType,
        title: string,
        message: string,
        metadata?: Record<string, unknown>,
    ): NewInsight {
        return { type, title, message, metadata };
    }
}
