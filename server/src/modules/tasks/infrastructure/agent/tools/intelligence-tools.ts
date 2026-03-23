import { ServiceProvider } from '../../../../common/base/services/ServiceProvider';
import { FindSimilarTasks } from '../../../services/FindSimilarTasks';
import { jsonTool } from './shared';

export function createTaskIntelligenceTools(services: ServiceProvider) {
    return [
        jsonTool({
            name: 'find_similar_tasks',
            description:
                'Search for tasks similar to a query using semantic embeddings. ' +
                'Use this before creating a task to check for duplicates, or when the user asks about related/past tasks.',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Text to search for similar tasks (e.g. a task title or description)',
                    },
                    limit: {
                        type: 'number',
                        description: 'Max results to return (default: 5)',
                    },
                },
                required: ['query'],
            },
            execute: async (input) => {
                const results = await services.get(FindSimilarTasks).execute(input.query, input.limit);

                if (results.length === 0) {
                    return { message: 'No similar tasks found', results: [] };
                }

                return { count: results.length, results };
            },
        }),
    ];
}
