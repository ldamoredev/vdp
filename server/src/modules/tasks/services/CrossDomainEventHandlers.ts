import { EventBus } from '../../common/base/event-bus/EventBus';
import { EventSubscriber } from '../../common/base/event-bus/EventSubscriber';
import { DomainEvent } from '../../common/base/event-bus/DomainEvent';
import { TaskInsightsStore } from './TaskInsightsStore';
import { Logger } from '../../common/base/observability/logging/Logger';
import { SpendingSpikePayload } from '../../wallet/domain/events/SpendingSpike';

/**
 * Cross-domain event handlers for the Tasks module.
 *
 * Listens to events from other domains (e.g., Wallet) and generates
 * task insights when relevant patterns are detected.
 *
 * This is the first implementation of the cross-domain thesis:
 * "It knows I overspent AND it's reminding me to review tasks."
 */
export class CrossDomainEventHandlers implements EventSubscriber {
    constructor(
        private readonly eventBus: EventBus,
        private readonly insightsStore: TaskInsightsStore,
        private readonly logger: Logger,
    ) {}

    subscribe(): void {
        this.eventBus.on('wallet.spending.spike', (event: DomainEvent) => {
            const payload = event.payload as SpendingSpikePayload;
            this.logger.info('cross-domain: spending spike → task insight', {
                percentageIncrease: payload.percentageIncrease,
                totalExpenses: payload.totalExpenses,
            });

            this.insightsStore.addInsight({
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
                },
            });
        });
    }
}
