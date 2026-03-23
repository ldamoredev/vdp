import { describe, expect, it } from 'vitest';

import { EventBus } from '../../../common/base/event-bus/EventBus';
import { DailyAllCompleted } from '../../domain/events/DailyAllCompleted';
import { TaskCompleted } from '../../domain/events/TaskCompleted';
import { TaskStuck } from '../../domain/events/TaskStuck';
import { TasksOverloaded } from '../../domain/events/TasksOverloaded';
import { TaskEventHandlers } from '../../services/TaskEventHandlers';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';

describe('TaskEventHandlers', () => {
    it('projects task domain events into actionable insights and streak state', async () => {
        const eventBus = new EventBus();
        const insightsStore = new TaskInsightsStore();

        new TaskEventHandlers(eventBus, insightsStore).subscribe();

        await eventBus.emit(new TaskCompleted({ taskId: 'task-1', scheduledDate: '2026-03-22' }));
        await eventBus.emit(new DailyAllCompleted({ date: '2026-03-22', count: 3 }));
        await eventBus.emit(new TaskStuck({ taskId: 'task-2', title: 'Cerrar tema', carryOverCount: 3 }));
        await eventBus.emit(new TasksOverloaded({ carryOverRate: 72, period: 'last_7_days' }));

        const insights = insightsStore.getUnreadInsights();

        expect(insights).toHaveLength(4);
        expect(insights.map((insight) => insight.title)).toEqual([
            'Tarea completada',
            '✅ Día perfecto',
            '🔄 Tarea atascada',
            '📊 Sobrecarga detectada',
        ]);
        expect(insightsStore.getStreak()).toEqual({
            current: 1,
            best: 1,
            lastCompletedDate: '2026-03-22',
        });
        expect(insights[3]?.message).toContain('Sobrecarga alta');
    });
});
