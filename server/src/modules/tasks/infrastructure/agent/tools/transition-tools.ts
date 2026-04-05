import { ServiceProvider } from '../../../../common/base/services/ServiceProvider';
import { CarryOverAllPending } from '../../../services/CarryOverAllPending';
import { CarryOverTask } from '../../../services/CarryOverTask';
import { CompleteTask } from '../../../services/CompleteTask';
import { DiscardTask } from '../../../services/DiscardTask';
import { TASK_ID_INPUT_SCHEMA, jsonTool } from './shared';
import { AuthContextStorage } from '../../../../auth/infrastructure/http/AuthContextStorage';

export function createTaskTransitionTools(services: ServiceProvider, authContextStorage: AuthContextStorage) {
    return [
        jsonTool({
            name: 'complete_task',
            description: 'Mark a task as done.',
            inputSchema: TASK_ID_INPUT_SCHEMA,
            execute: async (input) => {
                const userId = authContextStorage.getAuthContext().userId!;
                return (await services.get(CompleteTask).execute(userId, input.taskId)) || { error: 'Task not found' };
            },
        }),
        jsonTool({
            name: 'carry_over_task',
            description:
                "Move a pending task to another day (default: tomorrow). Increments carry-over counter.",
            inputSchema: {
                type: 'object',
                properties: {
                    taskId: { type: 'string', description: 'Task ID' },
                    toDate: { type: 'string', description: 'Target date (YYYY-MM-DD). Default: tomorrow.' },
                },
                required: ['taskId'],
            },
            execute: async (input) => {
                const userId = authContextStorage.getAuthContext().userId!;
                return (await services.get(CarryOverTask).execute(userId, input.taskId, input.toDate)) || { error: 'Task not found' };
            },
        }),
        jsonTool({
            name: 'discard_task',
            description: "Discard a task (won't be carried over).",
            inputSchema: TASK_ID_INPUT_SCHEMA,
            execute: async (input) => {
                const userId = authContextStorage.getAuthContext().userId!;
                return (await services.get(DiscardTask).execute(userId, input.taskId)) || { error: 'Task not found' };
            },
        }),
        jsonTool({
            name: 'carry_over_all_pending',
            description:
                'Carry over ALL pending tasks from a date to tomorrow (or another date). Use this only when the user explicitly wants to move everything.',
            inputSchema: {
                type: 'object',
                properties: {
                    fromDate: { type: 'string', description: 'Source date (YYYY-MM-DD)' },
                    toDate: { type: 'string', description: 'Target date (YYYY-MM-DD). Default: tomorrow.' },
                },
                required: ['fromDate'],
            },
            execute: async (input) => {
                const userId = authContextStorage.getAuthContext().userId!;
                const results = await services.get(CarryOverAllPending).execute(userId, input.fromDate, input.toDate);
                return { carriedOver: results.length, tasks: results };
            },
        }),
    ];
}
