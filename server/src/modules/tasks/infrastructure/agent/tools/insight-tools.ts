import { AuthContextStorage } from '../../../../auth/infrastructure/http/AuthContextStorage';
import { TaskInsightsStore } from '../../../services/TaskInsightsStore';
import { EMPTY_OBJECT_SCHEMA, jsonTool } from './shared';

export function createTaskInsightTools(authContextStorage: AuthContextStorage, insightsStore?: TaskInsightsStore) {
    if (!insightsStore) {
        return [];
    }

    return [
        jsonTool({
            name: 'get_insights',
            description:
                'Get unread insights: achievements (streaks, perfect days), warnings (overload), ' +
                'and suggestions (stuck tasks). ALWAYS call this at the start of a conversation ' +
                'to surface relevant proactive information to the user.',
            inputSchema: EMPTY_OBJECT_SCHEMA,
            execute: async () => {
                const userId = authContextStorage.getAuthContext().userId!;
                return insightsStore.getSnapshot(userId);
            },
        }),
        jsonTool({
            name: 'mark_insights_read',
            description: 'Mark all insights as read after surfacing them to the user.',
            inputSchema: EMPTY_OBJECT_SCHEMA,
            execute: async () => {
                const userId = authContextStorage.getAuthContext().userId!;
                insightsStore.markAllRead(userId);
                return { message: 'All insights marked as read' };
            },
        }),
    ];
}
