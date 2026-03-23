import { TaskInsightsStore } from '../../../services/TaskInsightsStore';
import { EMPTY_OBJECT_SCHEMA, jsonTool } from './shared';

export function createTaskInsightTools(insightsStore?: TaskInsightsStore) {
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
            execute: async () => insightsStore.getSnapshot(),
        }),
        jsonTool({
            name: 'mark_insights_read',
            description: 'Mark all insights as read after surfacing them to the user.',
            inputSchema: EMPTY_OBJECT_SCHEMA,
            execute: async () => {
                insightsStore.markAllRead();
                return { message: 'All insights marked as read' };
            },
        }),
    ];
}
