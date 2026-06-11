import { describe, it, expect, beforeEach } from 'vitest';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';
import { FakeTaskInsightRepository } from '../fakes/FakeTaskInsightRepository';
import { NoOpLogger } from '../../../common/infrastructure/observability/logging/NoOpLogger';

const userId = 'user-1';

function flushAsyncWrites(): Promise<void> {
    return new Promise((resolve) => setImmediate(resolve));
}

describe('TaskInsightsStore persistence', () => {
    let repository: FakeTaskInsightRepository;
    let store: TaskInsightsStore;

    beforeEach(() => {
        repository = new FakeTaskInsightRepository();
        store = new TaskInsightsStore(new NoOpLogger(), repository);
    });

    it('persists added insights', async () => {
        const insight = store.addInsight({
            userId,
            type: 'warning',
            title: 'Gasto elevado',
            message: 'Subió 80%',
            metadata: { source: 'wallet.spending.spike' },
        });

        await flushAsyncWrites();

        const persisted = repository.find(insight.id);
        expect(persisted).toBeDefined();
        expect(persisted?.userId).toBe(userId);
        expect(persisted?.title).toBe('Gasto elevado');
        expect(persisted?.read).toBe(false);
        expect(persisted?.metadata).toEqual({ source: 'wallet.spending.spike' });
    });

    it('persists the read flag when an insight is marked read', async () => {
        const insight = store.addInsight({
            userId,
            type: 'suggestion',
            title: 'Sugerencia',
            message: 'Probá dividir la tarea',
        });
        await flushAsyncWrites();

        store.markInsightRead(userId, insight.id);
        await flushAsyncWrites();

        expect(repository.find(insight.id)?.read).toBe(true);
    });

    it('persists markAllRead per user', async () => {
        const first = store.addInsight({ userId, type: 'warning', title: 'a', message: 'a' });
        const second = store.addInsight({ userId, type: 'warning', title: 'b', message: 'b' });
        const other = store.addInsight({ userId: 'user-2', type: 'warning', title: 'c', message: 'c' });
        await flushAsyncWrites();

        store.markAllRead(userId);
        await flushAsyncWrites();

        expect(repository.find(first.id)?.read).toBe(true);
        expect(repository.find(second.id)?.read).toBe(true);
        expect(repository.find(other.id)?.read).toBe(false);
    });

    it('persists insights as read when an SSE listener marks them during delivery', async () => {
        // Mirrors subscribeInsightsToSSE: a connected client marks the insight
        // read synchronously inside the listener, before the insert runs.
        store.onInsight((insight, insightUserId) => {
            store.markInsightRead(insightUserId, insight.id);
        });

        const insight = store.addInsight({
            userId,
            type: 'achievement',
            title: 'Día perfecto',
            message: 'Completaste todo',
        });
        await flushAsyncWrites();

        expect(repository.find(insight.id)?.read).toBe(true);
    });

    it('hydrates the in-memory state from the repository', async () => {
        repository.seed([
            {
                id: 'i-1',
                userId,
                type: 'warning',
                title: 'Viejo',
                message: 'Insight previo al restart',
                metadata: { source: 'wallet.spending.spike' },
                read: false,
                createdAt: new Date('2026-06-10T10:00:00Z'),
            },
            {
                id: 'i-2',
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
        expect(unread[0].id).toBe('i-1');

        const recent = store.getRecentInsights(userId, 5);
        expect(recent.map((insight) => insight.id)).toEqual(['i-2', 'i-1']);
        // Cross-domain action resolution must survive the roundtrip.
        expect(recent[1].action?.domain).toBe('wallet');
    });

    it('keeps the per-user cap in the repository', async () => {
        for (let i = 0; i < 55; i++) {
            store.addInsight({ userId, type: 'suggestion', title: `t${i}`, message: 'm' });
        }
        await flushAsyncWrites();
        await flushAsyncWrites();

        expect(repository.size).toBeLessThanOrEqual(50);
    });

    it('works without a repository (memory-only fallback)', () => {
        const memoryOnly = new TaskInsightsStore(new NoOpLogger());
        const insight = memoryOnly.addInsight({ userId, type: 'warning', title: 't', message: 'm' });

        expect(memoryOnly.getUnreadInsights(userId)).toHaveLength(1);
        memoryOnly.markInsightRead(userId, insight.id);
        expect(memoryOnly.getUnreadInsights(userId)).toHaveLength(0);
    });
});
