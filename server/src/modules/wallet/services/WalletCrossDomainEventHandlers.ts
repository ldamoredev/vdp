import { EventBus } from '../../common/base/event-bus/EventBus';
import { EventSubscriber } from '../../common/base/event-bus/EventSubscriber';
import { DomainEvent } from '../../common/base/event-bus/DomainEvent';
import { Logger } from '../../common/base/observability/logging/Logger';
import { TaskCompletedPayload } from '../../tasks/domain/events/TaskCompleted';
import { isPaymentTask } from './payment-intent';
import { WalletInsightFactory } from './WalletInsightFactory';
import { WalletInsightsStore } from './WalletInsightsStore';

/**
 * Cross-domain event handlers for the Wallet module — the inverse direction of
 * the cross-domain thesis. Where Tasks reacts to other domains by creating
 * tasks, Wallet reacts to Tasks by surfacing wallet-side suggestions whose
 * output naturally belongs to Wallet (a transaction worth registering).
 *
 * Today: completing a payment task → "register the expense?" suggestion insight.
 */
export class WalletCrossDomainEventHandlers implements EventSubscriber {
    constructor(
        private readonly eventBus: EventBus,
        private readonly insightsStore: WalletInsightsStore,
        private readonly logger: Logger,
    ) {}

    subscribe(): void {
        this.eventBus.on('tasks.task.completed', (event: DomainEvent) => {
            this.handleTaskCompleted(event.payload as TaskCompletedPayload);
        });
    }

    private handleTaskCompleted(payload: TaskCompletedPayload): void {
        if (!isPaymentTask(payload.title)) return;

        try {
            this.insightsStore.addInsight(WalletInsightFactory.paymentSuggestion(payload));
        } catch (err: unknown) {
            this.logger.error('cross-domain: failed to create payment suggestion insight', {
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }
}
