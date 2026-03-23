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
            type: 'achievement',
            title: 'Primer insight',
            message: 'Mensaje',
        });
        unsubscribe();
        store.addInsight({
            type: 'warning',
            title: 'Segundo insight',
            message: 'Mensaje',
        });

        expect(received).toEqual(['Primer insight']);
    });
});
