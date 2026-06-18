import { CQBus } from '@nbottarini/cqbus';
import { executionContextFromAuth } from '../../../../common/app/auth/AuthExecutionContext';
import { CarryOverAllPendingCommand } from '../../../app/CarryOverAllPendingCommand';
import { CarryOverTaskCommand } from '../../../app/CarryOverTaskCommand';
import { CompleteTaskCommand } from '../../../app/CompleteTaskCommand';
import { DiscardTaskCommand } from '../../../app/DiscardTaskCommand';
import { TASK_ID_INPUT_SCHEMA, invalidDateError, jsonTool } from './shared';
import { AuthContextStorage } from '../../../../common/http/AuthContextStorage';

export function createTaskTransitionTools(bus: CQBus, authContextStorage: AuthContextStorage) {
    const executionContext = () => executionContextFromAuth(authContextStorage.getAuthContext());

    return [
        jsonTool({
            name: 'complete_task',
            description: 'Mark a task as done.',
            inputSchema: TASK_ID_INPUT_SCHEMA,
            execute: async (input) => {
                return (await bus.execute(new CompleteTaskCommand(input.taskId), executionContext())) || { error: 'Task not found' };
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
                const dateError = invalidDateError(input, ['toDate']);
                if (dateError) return dateError;

                return (await bus.execute(new CarryOverTaskCommand(input.taskId, input.toDate), executionContext())) || { error: 'Task not found' };
            },
        }),
        jsonTool({
            name: 'discard_task',
            description: "Discard a task (won't be carried over).",
            inputSchema: TASK_ID_INPUT_SCHEMA,
            execute: async (input) => {
                return (await bus.execute(new DiscardTaskCommand(input.taskId), executionContext())) || { error: 'Task not found' };
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
                const dateError = invalidDateError(input, ['fromDate', 'toDate']);
                if (dateError) return dateError;

                const results = await bus.execute(
                    new CarryOverAllPendingCommand(input.fromDate, input.toDate),
                    executionContext(),
                );
                return { carriedOver: results.length, tasks: results };
            },
        }),
    ];
}
