import { describe, expect, it, vi } from 'vitest';
import { WalletInsightsStore } from '../../services/WalletInsightsStore';

describe('WalletInsightsStore', () => {
    it('starts with no insights', () => {
        const store = new WalletInsightsStore();

        expect(store.getUnreadInsights('user-1')).toEqual([]);
    });

    it('adds and retrieves insights by user', () => {
        const store = new WalletInsightsStore();

        const insight = store.addInsight({
            userId: 'user-1',
            type: 'warning',
            title: 'Gasto elevado',
            message: 'Tu gasto subio 60%',
        });

        expect(insight.id).toBeTruthy();
        expect(insight.read).toBe(false);
        expect(store.getUnreadInsights('user-1')).toHaveLength(1);
        expect(store.getUnreadInsights('user-2')).toEqual([]);
    });

    it('notifies listeners when an insight is added', () => {
        const store = new WalletInsightsStore();
        const listener = vi.fn();

        store.onInsight(listener);
        store.addInsight({
            userId: 'user-1',
            type: 'suggestion',
            title: 'Revisar delivery',
            message: 'Subio esta semana.',
        });

        expect(listener).toHaveBeenCalledOnce();
        expect(listener).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Revisar delivery',
                read: false,
            }),
            'user-1',
        );
    });

    it('marks a single insight as read', () => {
        const store = new WalletInsightsStore();
        const insight = store.addInsight({
            userId: 'user-1',
            type: 'warning',
            title: 'Gasto elevado',
            message: 'Tu gasto subio 60%',
        });

        store.markInsightRead('user-1', insight.id);

        expect(store.getUnreadInsights('user-1')).toEqual([]);
    });

    it('keeps at most fifty insights per user', () => {
        const store = new WalletInsightsStore();

        for (let index = 0; index < 55; index += 1) {
            store.addInsight({
                userId: 'user-1',
                type: 'warning',
                title: `Insight ${index}`,
                message: `Mensaje ${index}`,
            });
        }

        expect(store.getUnreadInsights('user-1')).toHaveLength(50);
    });
});
