import { ServiceProvider } from '../../../../common/base/services/ServiceProvider';
import { todayISO } from '../../../../common/base/time/dates';
import { AddTaskNote } from '../../../services/AddTaskNote';
import { CreateTask } from '../../../services/CreateTask';
import { DeleteTask } from '../../../services/DeleteTask';
import { GetTask } from '../../../services/GetTask';
import { GetTasks } from '../../../services/GetTasks';
import { UpdateTask } from '../../../services/UpdateTask';
import {
    TASK_DOMAINS,
    TASK_ID_INPUT_SCHEMA,
    TASK_NOTE_TYPES,
    TASK_PRIORITIES,
    TASK_STATUSES,
    ToolInput,
    jsonTool,
} from './shared';
import { AuthContextStorage } from '../../../../auth/infrastructure/http/AuthContextStorage';

export function createTaskManagementTools(services: ServiceProvider, authContextStorage: AuthContextStorage) {
    return [
        jsonTool({
            name: 'create_task',
            description:
                'Create a new task for today (or a specific date). Only use this after the task is clear enough to execute. ' +
                'If the user message is vague, ask a follow-up first. Returns the created task. ' +
                "Automatically checks for similar existing tasks — if duplicates are found, the response includes a 'similarTasks' warning. " +
                'IMPORTANT: Only call this tool ONCE per task. Never call it twice for the same request.',
            inputSchema: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Task title' },
                    description: { type: 'string', description: 'Optional description' },
                    priority: {
                        type: 'number',
                        enum: TASK_PRIORITIES,
                        description: 'Priority: 1=low, 2=medium, 3=high. Default: 2',
                    },
                    scheduledDate: {
                        type: 'string',
                        description: 'Date (YYYY-MM-DD). Defaults to today.',
                    },
                    domain: {
                        type: 'string',
                        enum: TASK_DOMAINS,
                        description: 'Optional domain tag',
                    },
                },
                required: ['title'],
            },
            execute: async (input) => {
                return createTaskWithSimilarityCheck(services, authContextStorage, input);
            },
        }),
        jsonTool({
            name: 'list_tasks',
            description:
                "List tasks filtered by date, status, domain, or priority. Defaults to today's pending tasks.",
            inputSchema: {
                type: 'object',
                properties: {
                    scheduledDate: {
                        type: 'string',
                        description: 'Date filter (YYYY-MM-DD). Default: today.',
                    },
                    status: {
                        type: 'string',
                        enum: TASK_STATUSES,
                    },
                    domain: {
                        type: 'string',
                        enum: TASK_DOMAINS,
                    },
                    priority: { type: 'number', enum: TASK_PRIORITIES },
                },
                required: [],
            },
            execute: async (input) => {
                const userId = authContextStorage.getAuthContext().userId!;
                return services.get(GetTasks).execute(userId, {
                    scheduledDate: input.scheduledDate || todayISO(),
                    status: input.status,
                    domain: input.domain,
                    priority: input.priority,
                });
            },
        }),
        jsonTool({
            name: 'get_task',
            description:
                'Get a task by ID with its notes. Use this before proposing a breakdown or adding clarification notes to an existing task.',
            inputSchema: TASK_ID_INPUT_SCHEMA,
            execute: async (input) => {
                const userId = authContextStorage.getAuthContext().userId!;
                return (await services.get(GetTask).executeWithNotes(userId, input.taskId)) || { error: 'Task not found' };
            },
        }),
        jsonTool({
            name: 'update_task',
            description:
                "Update a task's title, description, priority, date, or domain. Use description to store clarified outcome or execution context when the user provides it.",
            inputSchema: {
                type: 'object',
                properties: {
                    taskId: { type: 'string', description: 'Task ID' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    priority: { type: 'number', enum: TASK_PRIORITIES },
                    scheduledDate: { type: 'string' },
                    domain: {
                        type: 'string',
                        enum: TASK_DOMAINS,
                    },
                },
                required: ['taskId'],
            },
            execute: async (input) => {
                const userId = authContextStorage.getAuthContext().userId!;
                const { taskId, ...data } = input;
                return (await services.get(UpdateTask).execute(userId, taskId, data)) || { error: 'Task not found' };
            },
        }),
        jsonTool({
            name: 'delete_task',
            description: 'Permanently delete a task.',
            inputSchema: TASK_ID_INPUT_SCHEMA,
            execute: async (input) => {
                const userId = authContextStorage.getAuthContext().userId!;
                return (await services.get(DeleteTask).execute(userId, input.taskId))
                    ? { message: 'Task deleted' }
                    : { error: 'Task not found' };
            },
        }),
        jsonTool({
            name: 'add_task_note',
            description:
                'Add a note to a task. Use this to save breakdown steps, blockers, or clarified next actions. ' +
                'For breakdowns, prefer one note per concrete step and phrase it as an executable action.',
            inputSchema: {
                type: 'object',
                properties: {
                    taskId: { type: 'string', description: 'Task ID' },
                    content: { type: 'string', description: 'Note content' },
                    type: {
                        type: 'string',
                        enum: TASK_NOTE_TYPES,
                        description: 'Note type. Use breakdown_step for executable steps, blocker for explicit obstacles.',
                    },
                },
                required: ['taskId', 'content'],
            },
            execute: async (input) => {
                const userId = authContextStorage.getAuthContext().userId!;
                return services.get(AddTaskNote).execute(userId, input.taskId, input.content, input.type);
            },
        }),
    ];
}

async function createTaskWithSimilarityCheck(
    services: ServiceProvider,
    authContextStorage: AuthContextStorage,
    input: ToolInput,
): Promise<Record<string, unknown>> {
    const userId = authContextStorage.getAuthContext().userId!;
    const result = await services.get(CreateTask).execute(userId, {
        title: input.title,
        description: input.description,
        priority: input.priority,
        scheduledDate: input.scheduledDate,
        domain: input.domain,
    }, true);

    const response: Record<string, unknown> = { ...result.task };

    if (result.similarTasks && result.similarTasks.length > 0) {
        response.similarTasks = result.similarTasks.map(t => ({
            content: t.content,
            matchPercent: t.matchPercent
        }));
        response.warning = `Se encontraron ${result.similarTasks.length} tarea(s) similares. Avisale al usuario.`;
    }

    return response;
}
