import { EventBus } from '../../common/base/event-bus/EventBus';
import { EventSubscriber } from '../../common/base/event-bus/EventSubscriber';
import { DomainEvent } from '../../common/base/event-bus/DomainEvent';
import { DetectSpendingSpike } from './DetectSpendingSpike';
import { Logger } from '../../common/base/observability/logging/Logger';
import { SpendingSpikePayload } from '../domain/events/SpendingSpike';
import { TransactionCreatedPayload } from '../domain/events/TransactionCreated';
import { WalletInsightFactory } from './WalletInsightFactory';
import { WalletInsightsStore } from './WalletInsightsStore';

export class WalletEventHandlers implements EventSubscriber {
    constructor(
        private readonly eventBus: EventBus,
        private readonly detectSpendingSpike: DetectSpendingSpike,
        private readonly insightsStore: WalletInsightsStore,
        private readonly logger: Logger,
    ) {}

    subscribe(): void {
        this.eventBus.on('wallet.transaction.created', (event: DomainEvent) => {
            const { userId } = event.payload as TransactionCreatedPayload;
            this.detectSpendingSpike.execute(userId).catch((err: unknown) => {
                this.logger.warn('DetectSpendingSpike failed', {
                    error: err instanceof Error ? err.message : String(err),
                });
            });
        });

        this.eventBus.on('wallet.spending.spike', (event: DomainEvent) => {
            const payload = event.payload as SpendingSpikePayload;
            this.insightsStore.addInsight(WalletInsightFactory.spendingSpike(payload));
        });
    }
}
