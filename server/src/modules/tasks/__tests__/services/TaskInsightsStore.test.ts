import { describe, expect, it } from 'vitest';

import { TaskInsightsStore } from '../../services/TaskInsightsStore';

describe('TaskInsightsStore', () => {
    it('records consecutive perfect days using local date semantics', () => {
        const store = new TaskInsightsStore();

        store.recordPerfectDay('2026-03-22');
        store.recordPerfectDay('2026-03-23');

        expect(store.getStreak()).toEqual({
            current: 2,
            best: 2,
            lastCompletedDate: '2026-03-23',
        });
    });

    it('treats the same day as idempotent', () => {
        const store = new TaskInsightsStore();

        store.recordPerfectDay('2026-03-22');
        store.recordPerfectDay('2026-03-22');

        expect(store.getStreak()).toEqual({
            current: 1,
            best: 1,
            lastCompletedDate: '2026-03-22',
        });
    });

    it('publishes insights to listeners and supports unsubscribe', () => {
        const store = new TaskInsightsStore();
        const received: string[] = [];
        const unsubscribe = store.onInsight((insight) => {
            received.push(insight.title);
        });

        store.addInsight({
            userId: 'test-user-id',
            type: 'achievement',
            title: 'Primer insight',
            message: 'Mensaje',
        });
        unsubscribe();
        store.addInsight({
            userId: 'test-user-id',
            type: 'warning',
            title: 'Segundo insight',
            message: 'Mensaje',
        });

        expect(received).toEqual(['Primer insight']);
    });

    it('filters insights and read state by user', () => {
        const store = new TaskInsightsStore();

        store.addInsight({
            userId: 'user-a',
            type: 'achievement',
            title: 'Insight A1',
            message: 'Mensaje A1',
        });
        store.addInsight({
            userId: 'user-b',
            type: 'warning',
            title: 'Insight B1',
            message: 'Mensaje B1',
        });
        store.addInsight({
            userId: 'user-a',
            type: 'suggestion',
            title: 'Insight A2',
            message: 'Mensaje A2',
        });

        expect(store.getRecentInsights('user-a', 10).map((insight) => insight.title)).toEqual([
            'Insight A2',
            'Insight A1',
        ]);
        expect(store.getUnreadInsights('user-b').map((insight) => insight.title)).toEqual([
            'Insight B1',
        ]);

        store.markAllRead('user-a');

        expect(store.getUnreadInsights('user-a')).toEqual([]);
        expect(store.getUnreadInsights('user-b').map((insight) => insight.title)).toEqual([
            'Insight B1',
        ]);
    });

    it('tracks streaks per user', () => {
        const store = new TaskInsightsStore();

        store.recordPerfectDay('user-a', '2026-03-22');
        store.recordPerfectDay('user-a', '2026-03-23');
        store.recordPerfectDay('user-b', '2026-03-30');

        expect(store.getStreak('user-a')).toEqual({
            current: 2,
            best: 2,
            lastCompletedDate: '2026-03-23',
        });
        expect(store.getStreak('user-b')).toEqual({
            current: 1,
            best: 1,
            lastCompletedDate: '2026-03-30',
        });
    });

    it('resolves explicit metadata actions without requiring actionDomain', () => {
        const store = new TaskInsightsStore();

        store.addInsight({
            userId: 'user-a',
            type: 'warning',
            title: 'Insight con accion',
            message: 'Mensaje',
            metadata: {
                source: 'wallet.spending.spike',
                actionHref: '/wallet?view=spending',
                actionLabel: 'Abrir detalle',
            },
        });

        expect(store.getRecentInsights('user-a', 1)).toEqual([
            expect.objectContaining({
                title: 'Insight con accion',
                metadata: {
                    source: 'wallet.spending.spike',
                    actionHref: '/wallet?view=spending',
                    actionLabel: 'Abrir detalle',
                },
                action: {
                    href: '/wallet?view=spending',
                    label: 'Abrir detalle',
                    domain: 'wallet',
                },
            }),
        ]);
    });

    it('retains recent insights independently per user under retention pressure', () => {
        const store = new TaskInsightsStore();

        store.addInsight({
            userId: 'user-b',
            type: 'achievement',
            title: 'User B insight',
            message: 'Mensaje B',
        });

        for (let index = 1; index <= 51; index += 1) {
            store.addInsight({
                userId: 'user-a',
                type: 'warning',
                title: `User A insight ${index}`,
                message: `Mensaje A${index}`,
            });
        }

        expect(store.getAllInsights('user-b', 10)).toEqual([
            expect.objectContaining({
                title: 'User B insight',
            }),
        ]);
        expect(store.getAllInsights('user-a', 100)).toHaveLength(50);
        expect(store.getAllInsights('user-a', 100).map((insight) => insight.title)).not.toContain('User A insight 1');
    });

    it('reset clears insights and streaks', () => {
        const store = new TaskInsightsStore();

        store.addInsight({
            userId: 'user-a',
            type: 'achievement',
            title: 'Insight A1',
            message: 'Mensaje A1',
        });
        store.recordPerfectDay('user-a', '2026-03-22');

        store.reset();

        expect(store.getAllInsights('user-a', 10)).toEqual([]);
        expect(store.getStreak('user-a')).toEqual({
            current: 0,
            best: 0,
            lastCompletedDate: null,
        });
    });
});
