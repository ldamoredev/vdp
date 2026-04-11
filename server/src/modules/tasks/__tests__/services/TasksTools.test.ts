import { describe, expect, it } from 'vitest';

import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { AuthContextStorage } from '../../../auth/infrastructure/http/AuthContextStorage';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';
import { TasksTools } from '../../infrastructure/agent/tools.js';

const authContextStorage = new AuthContextStorage();

describe('TasksTools', () => {
    it('composes the base task tool registry without insights tools by default', () => {
        const tools = TasksTools.createTasksTools(new ServiceProvider(), authContextStorage);

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
            'get_wallet_context',
            'get_weekly_summary',
            'get_recommendations',
        ]);
    });

    it('adds insight tools when an insights store is available', () => {
        const tools = TasksTools.createTasksTools(new ServiceProvider(), authContextStorage, new TaskInsightsStore());

        expect(tools.slice(-2).map((tool) => tool.name)).toEqual([
            'get_insights',
            'mark_insights_read',
        ]);
    });

    it('scopes get_insights to the authenticated user', async () => {
        const insightsStore = new TaskInsightsStore();
        insightsStore.addInsight({
            userId: 'user-a',
            type: 'achievement',
            title: 'Insight A1',
            message: 'Mensaje A1',
        });
        insightsStore.addInsight({
            userId: 'user-b',
            type: 'warning',
            title: 'Insight B1',
            message: 'Mensaje B1',
        });

        const getInsightsTool = TasksTools.createTasksTools(new ServiceProvider(), authContextStorage, insightsStore)
            .find((tool) => tool.name === 'get_insights');

        authContextStorage.setAuthContext({
            isAuthenticated: true,
            userId: 'user-a',
            sessionId: 'session-a',
            role: 'user',
            email: 'user-a@example.com',
            displayName: 'User A',
        });

        const result = JSON.parse(await getInsightsTool!.execute({}));

        expect(result).toEqual({
            unread: [
                expect.objectContaining({
                    title: 'Insight A1',
                }),
            ],
            streak: {
                current: 0,
                best: 0,
                lastCompletedDate: null,
            },
            totalInsights: 1,
        });
    });

    it('scopes mark_insights_read to the authenticated user', async () => {
        const insightsStore = new TaskInsightsStore();
        insightsStore.addInsight({
            userId: 'user-a',
            type: 'achievement',
            title: 'Insight A1',
            message: 'Mensaje A1',
        });
        insightsStore.addInsight({
            userId: 'user-b',
            type: 'warning',
            title: 'Insight B1',
            message: 'Mensaje B1',
        });

        const markInsightsReadTool = TasksTools.createTasksTools(new ServiceProvider(), authContextStorage, insightsStore)
            .find((tool) => tool.name === 'mark_insights_read');

        authContextStorage.setAuthContext({
            isAuthenticated: true,
            userId: 'user-a',
            sessionId: 'session-a',
            role: 'user',
            email: 'user-a@example.com',
            displayName: 'User A',
        });

        expect(JSON.parse(await markInsightsReadTool!.execute({}))).toEqual({
            message: 'All insights marked as read',
        });
        expect(insightsStore.getUnreadInsights('user-a')).toEqual([]);
        expect(insightsStore.getUnreadInsights('user-b')).toEqual([
            expect.objectContaining({
                title: 'Insight B1',
            }),
        ]);
    });
});
