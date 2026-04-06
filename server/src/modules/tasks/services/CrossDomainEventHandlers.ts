import { EventBus } from '../../common/base/event-bus/EventBus';
import { EventSubscriber } from '../../common/base/event-bus/EventSubscriber';
import { DomainEvent } from '../../common/base/event-bus/DomainEvent';
import { todayISO } from '../../common/base/time/dates';
import { TaskInsightsStore } from './TaskInsightsStore';
import { CreateTask } from './CreateTask';
import { Logger } from '../../common/base/observability/logging/Logger';
import { SpendingSpikePayload } from '../../wallet/domain/events/SpendingSpike';

/**
 * Cross-domain event handlers for the Tasks module.
 *
 * Listens to events from other domains (e.g., Wallet) and generates
 * task insights + actionable tasks when relevant patterns are detected.
 *
 * This is the first implementation of the cross-domain thesis:
 * "It knows I overspent AND it creates a task to review it."
 */
export class CrossDomainEventHandlers implements EventSubscriber {
    constructor(
        private readonly eventBus: EventBus,
        private readonly insightsStore: TaskInsightsStore,
        private readonly createTask: CreateTask,
        private readonly logger: Logger,
    ) {}

    subscribe(): void {
        this.eventBus.on('wallet.spending.spike', (event: DomainEvent) => {
            this.handleSpendingSpike(event.payload as SpendingSpikePayload);
        });
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

        this.createTask
            .execute(payload.userId, {
                title: `Revisar gasto semanal: subió ${payload.percentageIncrease}%`,
                description:
                    `Gasto esta semana: $${payload.totalExpenses} ${payload.currency}. ` +
                    `Promedio anterior: $${payload.previousAverage} ${payload.currency}. ` +
                    `Revisar si hay gastos innecesarios o si fue un gasto puntual.`,
                priority: 3,
                scheduledDate: todayISO(),
                domain: 'finanzas',
            })
            .catch((err: unknown) => {
                this.logger.error('cross-domain: failed to create spending review task', {
                    error: err instanceof Error ? err.message : String(err),
                });
            });
    }
}
