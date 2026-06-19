import { CQBus, ExecutionContext } from '@nbottarini/cqbus';

import { UserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { EventSubscriber } from '../../common/base/event-bus/EventSubscriber';
import { DomainEvent } from '../../common/base/event-bus/DomainEvent';
import { todayISO } from '../../common/base/time/dates';
import { TaskInsightsStore } from './TaskInsightsStore';
import { Logger } from '../../common/base/observability/logging/Logger';
import { SpendingSpikePayload } from '../../wallet/domain/events/SpendingSpike';
import { HabitStreakBrokenPayload } from '../../health/domain/events/HabitStreakBroken';
import { HabitMilestonePayload } from '../../health/domain/events/HabitMilestone';
import { CounterMilestonePayload } from '../../health/domain/events/CounterMilestone';
import { GoalDeadlineApproachingPayload } from '../../health/domain/events/GoalDeadlineApproaching';
import { CreateTaskCommand } from '../app/CreateTaskCommand';
import { CreateTaskData } from '../domain/TaskRepository';

/**
 * Cross-domain event handlers for the Tasks module.
 *
 * Listens to events from other domains (Wallet, Health) and generates
 * task insights + actionable tasks through the Tasks CQBus surface when
 * relevant patterns are detected.
 *
 * This is the implementation of the cross-domain thesis:
 * "It knows I overspent AND it creates a task to review it."
 */
export class CrossDomainEventHandlers implements EventSubscriber {
    constructor(
        private readonly eventBus: EventBus,
        private readonly insightsStore: TaskInsightsStore,
        private readonly bus: CQBus,
        private readonly logger: Logger,
    ) {}

    subscribe(): void {
        this.eventBus.on('wallet.spending.spike', (event: DomainEvent) => {
            this.handleSpendingSpike(event.payload as SpendingSpikePayload);
        });
        this.eventBus.on('health.habit.streak_broken', (event: DomainEvent) => {
            this.handleHabitStreakBroken(event.payload as HabitStreakBrokenPayload);
        });
        this.eventBus.on('health.habit.milestone', (event: DomainEvent) => {
            this.handleHabitMilestone(event.payload as HabitMilestonePayload);
        });
        this.eventBus.on('health.counter.milestone', (event: DomainEvent) => {
            this.handleCounterMilestone(event.payload as CounterMilestonePayload);
        });
        this.eventBus.on('health.goal.deadline_approaching', (event: DomainEvent) => {
            this.handleGoalDeadlineApproaching(event.payload as GoalDeadlineApproachingPayload);
        });
    }

    private handleGoalDeadlineApproaching(payload: GoalDeadlineApproachingPayload): void {
        const deadlineLine = payload.daysLeft < 0
            ? `Venció hace ${Math.abs(payload.daysLeft)} día${Math.abs(payload.daysLeft) === 1 ? '' : 's'} (${payload.targetDate}).`
            : payload.daysLeft === 0
                ? `Vence HOY (${payload.targetDate}).`
                : `Vence en ${payload.daysLeft} día${payload.daysLeft === 1 ? '' : 's'} (${payload.targetDate}).`;

        this.insightsStore.addInsight({
            userId: payload.userId,
            type: 'warning',
            title: `Meta cerca del límite: "${payload.title}"`,
            message: `${deadlineLine} Decidila: arrancala, cumplila o soltala — pero que no venza sola.`,
            metadata: {
                source: 'health.goal.deadline_approaching',
                goalId: payload.goalId,
                targetDate: payload.targetDate,
                daysLeft: payload.daysLeft,
                actionHref: '/health',
                actionLabel: 'Ver metas',
            },
        });

        this.createTaskFromEvent(
            payload.userId,
            {
                title: `Decidir meta: ${payload.title}`,
                description:
                    `${deadlineLine} Esta tarea existe para que la meta no venza sin una decisión: ` +
                    `cumplirla, arrancarla hoy, o soltarla a conciencia.`,
                priority: payload.daysLeft <= 1 ? 3 : 2,
                scheduledDate: todayISO(),
                domain: 'health',
            },
            'cross-domain: failed to create goal deadline task',
        );
    }

    private handleCounterMilestone(payload: CounterMilestonePayload): void {
        const moneyLine = payload.moneyNotSpent
            ? ` ≈ $${payload.moneyNotSpent} ARS que no se fueron.`
            : '';

        this.insightsStore.addInsight({
            userId: payload.userId,
            type: 'achievement',
            title: `${payload.days} días de "${payload.counterName}"`,
            message:
                `Cruzaste los ${payload.days} días (llevás ${payload.currentDays}).${moneyLine}` +
                ` El contador corre solo — vos solo no lo cortes.`,
            metadata: {
                source: 'health.counter.milestone',
                counterId: payload.counterId,
                days: payload.days,
                currentDays: payload.currentDays,
                moneyNotSpent: payload.moneyNotSpent,
                actionHref: '/health',
                actionLabel: 'Ver contadores',
            },
        });
    }

    private handleHabitStreakBroken(payload: HabitStreakBrokenPayload): void {
        const unit = this.habitStreakUnit(payload.streakUnit);
        this.insightsStore.addInsight({
            userId: payload.userId,
            type: 'warning',
            title: `Se cortó tu racha de "${payload.habitName}"`,
            message:
                `Llevabas ${payload.lostStreak} ${unit.plural} ${unit.following} (último: ${payload.lastCompletedDate}). ` +
                `Retomaste hoy — el dato útil es no dejar pasar otro hueco.`,
            metadata: {
                source: 'health.habit.streak_broken',
                habitId: payload.habitId,
                lostStreak: payload.lostStreak,
                streakUnit: payload.streakUnit ?? 'day',
                lastCompletedDate: payload.lastCompletedDate,
                actionHref: '/health',
                actionLabel: 'Ver hábitos',
            },
        });

        this.createTaskFromEvent(
            payload.userId,
            {
                title: `Sostener hábito: ${payload.habitName}`,
                description:
                    `La racha de ${payload.lostStreak} ${unit.plural} se cortó el ${payload.lastCompletedDate}. ` +
                    `Hoy se retomó; esta tarea es el recordatorio de mantenerla esta semana.`,
                priority: 2,
                scheduledDate: todayISO(),
                domain: 'health',
            },
            'cross-domain: failed to create habit recovery task',
        );
    }

    private handleHabitMilestone(payload: HabitMilestonePayload): void {
        const unit = this.habitStreakUnit(payload.streakUnit);
        this.insightsStore.addInsight({
            userId: payload.userId,
            type: 'achievement',
            title: `${payload.streak} ${unit.plural} de "${payload.habitName}"`,
            message: `Racha de ${payload.streak} ${unit.plural} ${unit.following}. Sostenido sin ruido — así se construye.`,
            metadata: {
                source: 'health.habit.milestone',
                habitId: payload.habitId,
                streak: payload.streak,
                streakUnit: payload.streakUnit ?? 'day',
                actionHref: '/health',
                actionLabel: 'Ver hábitos',
            },
        });
    }

    private habitStreakUnit(unit: 'day' | 'week' | undefined): { plural: string; following: string } {
        return unit === 'week'
            ? { plural: 'semanas', following: 'seguidas' }
            : { plural: 'días', following: 'seguidos' };
    }

    private handleSpendingSpike(payload: SpendingSpikePayload): void {
        this.insightsStore.addInsight({
            userId: payload.userId,
            type: 'warning',
            title: 'Gasto elevado esta semana',
            message:
                `Tu gasto subió ${payload.percentageIncrease}% respecto al promedio ` +
                `($${payload.totalExpenses} vs $${payload.previousAverage} ${payload.currency}). ` +
                `¿Está todo bien con tus tareas? Revisá si necesitás ajustar prioridades.`,
            metadata: {
                source: 'wallet.spending.spike',
                totalExpenses: payload.totalExpenses,
                previousAverage: payload.previousAverage,
                percentageIncrease: payload.percentageIncrease,
                currency: payload.currency,
                periodFrom: payload.periodFrom,
                periodTo: payload.periodTo,
                actionHref: `/wallet/transactions?from=${payload.periodFrom}&to=${payload.periodTo}`,
                actionLabel: 'Revisar movimientos',
            },
        });

        this.createTaskFromEvent(
            payload.userId,
            {
                title: `Revisar gasto semanal: subió ${payload.percentageIncrease}%`,
                description:
                    `Gasto esta semana: $${payload.totalExpenses} ${payload.currency}. ` +
                    `Promedio anterior: $${payload.previousAverage} ${payload.currency}. ` +
                    `Revisar si hay gastos innecesarios o si fue un gasto puntual.`,
                priority: 3,
                scheduledDate: todayISO(),
                domain: 'finanzas',
            },
            'cross-domain: failed to create spending review task',
        );
    }

    private createTaskFromEvent(userId: string, input: CreateTaskData, failureMessage: string): void {
        this.bus
            .execute(new CreateTaskCommand(input), ExecutionContext.empty().withIdentity(new UserIdentity(userId)))
            .catch((err: unknown) => {
                this.logger.error(failureMessage, {
                    error: err instanceof Error ? err.message : String(err),
                });
            });
    }
}
