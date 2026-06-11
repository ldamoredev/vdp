import { describe, it, expect, beforeEach } from 'vitest';
import { WalletInsightsStore } from '../../services/WalletInsightsStore';
import { FakeWalletInsightRepository } from '../fakes/FakeWalletInsightRepository';
import { NoOpLogger } from '../../../common/infrastructure/observability/logging/NoOpLogger';

const userId = 'user-1';

function flushAsyncWrites(): Promise<void> {
    return new Promise((resolve) => setImmediate(resolve));
}

describe('WalletInsightsStore persistence', () => {
    let repository: FakeWalletInsightRepository;
    let store: WalletInsightsStore;

    beforeEach(() => {
        repository = new FakeWalletInsightRepository();
        store = new WalletInsightsStore(repository, new NoOpLogger());
    });

    it('persists added insights', async () => {
        const insight = store.addInsight({
            userId,
            type: 'warning',
            title: 'Pico de gasto',
            message: 'Subió 60%',
            metadata: { source: 'wallet.spending.spike' },
        });

        await flushAsyncWrites();

        const persisted = repository.find(insight.id);
        expect(persisted).toBeDefined();
        expect(persisted?.userId).toBe(userId);
        expect(persisted?.read).toBe(false);
    });

    it('persists the read flag when an insight is marked read', async () => {
        const insight = store.addInsight({ userId, type: 'suggestion', title: 't', message: 'm' });
        await flushAsyncWrites();

        store.markInsightRead(userId, insight.id);
        await flushAsyncWrites();

        expect(repository.find(insight.id)?.read).toBe(true);
    });

    it('persists insights as read when an SSE listener marks them during delivery', async () => {
        store.onInsight((insight, insightUserId) => {
            store.markInsightRead(insightUserId, insight.id);
        });

        const insight = store.addInsight({ userId, type: 'warning', title: 't', message: 'm' });
        await flushAsyncWrites();

        expect(repository.find(insight.id)?.read).toBe(true);
    });

    it('hydrates the in-memory state from the repository', async () => {
        repository.seed([
            {
                id: 'w-1',
                userId,
                type: 'warning',
                title: 'Pendiente',
                message: 'Insight previo al restart',
                read: false,
                createdAt: new Date('2026-06-10T10:00:00Z'),
            },
            {
                id: 'w-2',
                userId,
                type: 'achievement',
                title: 'Leído',
                message: 'Ya visto',
                read: true,
                createdAt: new Date('2026-06-10T12:00:00Z'),
            },
        ]);

        await store.hydrate();

        const unread = store.getUnreadInsights(userId);
        expect(unread).toHaveLength(1);
        expect(unread[0].id).toBe('w-1');
    });

    it('works without a repository (memory-only fallback)', () => {
        const memoryOnly = new WalletInsightsStore();
        const insight = memoryOnly.addInsight({ userId, type: 'warning', title: 't', message: 'm' });

        expect(memoryOnly.getUnreadInsights(userId)).toHaveLength(1);
        memoryOnly.markInsightRead(userId, insight.id);
        expect(memoryOnly.getUnreadInsights(userId)).toHaveLength(0);
    });
});
