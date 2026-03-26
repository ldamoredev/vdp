import { describe, expect, it } from 'vitest';

import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';
import { TasksTools } from '../../infrastructure/agent/tools.js';

describe('TasksTools', () => {
    it('composes the base task tool registry without insights tools by default', () => {
        const tools = TasksTools.createTasksTools(new ServiceProvider());

        expect(tools.map((tool) => tool.name)).toEqual([
            'create_task',
            'list_tasks',
            'get_task',
            'update_task',
            'delete_task',
            'add_task_note',
            'complete_task',
            'carry_over_task',
            'discard_task',
            'carry_over_all_pending',
            'get_end_of_day_review',
            'get_today_stats',
            'get_completion_trend',
            'find_similar_tasks',
            'get_planning_context',
            'get_weekly_summary',
            'get_recommendations',
        ]);
    });

    it('adds insight tools when an insights store is available', () => {
        const tools = TasksTools.createTasksTools(new ServiceProvider(), new TaskInsightsStore());

        expect(tools.slice(-2).map((tool) => tool.name)).toEqual([
            'get_insights',
            'mark_insights_read',
        ]);
    });
});
