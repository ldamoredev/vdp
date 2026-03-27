import { EventBus } from '../../common/base/event-bus/EventBus';
import { EventSubscriber } from '../../common/base/event-bus/EventSubscriber';
import { DetectSpendingSpike } from './DetectSpendingSpike';
import { Logger } from '../../common/base/observability/logging/Logger';

export class WalletEventHandlers implements EventSubscriber {
    constructor(
        private readonly eventBus: EventBus,
        private readonly detectSpendingSpike: DetectSpendingSpike,
        private readonly logger: Logger,
    ) {}

    subscribe(): void {
        this.eventBus.on('wallet.transaction.created', async () => {
            try {
                await this.detectSpendingSpike.execute();
            } catch (err: unknown) {
                this.logger.warn('DetectSpendingSpike failed', {
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        });
    }
}
