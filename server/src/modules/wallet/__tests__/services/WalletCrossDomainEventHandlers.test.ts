import { describe, it, expect, beforeEach } from 'vitest';

import { EventBus } from '../../../common/base/event-bus/EventBus';
import { NoOpLogger } from '../../../common/infrastructure/observability/logging/NoOpLogger';
import { TaskCompleted } from '../../../tasks/domain/events/TaskCompleted';
import { WalletCrossDomainEventHandlers } from '../../services/WalletCrossDomainEventHandlers';
import { WalletInsightsStore } from '../../services/WalletInsightsStore';

describe('WalletCrossDomainEventHandlers', () => {
    let eventBus: EventBus;
    let insightsStore: WalletInsightsStore;
    const logger = new NoOpLogger();

    function completeTask(title: string, overrides: Partial<{ userId: string; taskId: string; domain: string | null }> = {}) {
        return eventBus.emit(new TaskCompleted({
            userId: overrides.userId ?? 'user-1',
            taskId: overrides.taskId ?? 'task-1',
            scheduledDate: '2026-06-17',
            title,
            domain: overrides.domain ?? 'finanzas',
        }));
    }

    beforeEach(() => {
        eventBus = new EventBus();
        insightsStore = new WalletInsightsStore();
        new WalletCrossDomainEventHandlers(eventBus, insightsStore, logger).subscribe();
    });

    it('suggests registering an expense when a payment task is completed', async () => {
        await completeTask('Pagar el alquiler');

        expect(insightsStore.getUnreadInsights('user-1')).toEqual([
            expect.objectContaining({
                type: 'suggestion',
                metadata: expect.objectContaining({
                    source: 'tasks.task.completed',
                    taskId: 'task-1',
                    taskTitle: 'Pagar el alquiler',
                    actionLabel: expect.any(String),
                    actionHref: '/wallet?type=expense&description=Pagar%20el%20alquiler',
                }),
            }),
        ]);
    });

    it('does not suggest for a non-payment task', async () => {
        await completeTask('Llamar al dentista', { domain: 'health' });

        expect(insightsStore.getUnreadInsights('user-1')).toEqual([]);
    });

    it('ignores unrelated events', async () => {
        await eventBus.emit({
            domain: 'wallet',
            type: 'transaction.created',
            timestamp: new Date(),
            payload: { userId: 'user-1' },
        } as never);

        expect(insightsStore.getUnreadInsights('user-1')).toEqual([]);
    });
});
