import { ServiceProvider } from '../../../../common/base/services/ServiceProvider';
import { todayISO } from '../../../../common/base/time/dates';
import { AddTaskNote } from '../../../services/AddTaskNote';
import { CreateTask } from '../../../services/CreateTask';
import { DeleteTask } from '../../../services/DeleteTask';
import { FindSimilarTasks } from '../../../services/FindSimilarTasks';
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

type SimilarTaskMatch = {
    content: string;
    matchPercent: number;
};

export function createTaskManagementTools(services: ServiceProvider) {
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
            execute: async (input) => createTaskWithSimilarityCheck(services, input),
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
            execute: async (input) =>
                services.get(GetTasks).execute({
                    scheduledDate: input.scheduledDate || todayISO(),
                    status: input.status,
                    domain: input.domain,
                    priority: input.priority,
                }),
        }),
        jsonTool({
            name: 'get_task',
            description:
                'Get a task by ID with its notes. Use this before proposing a breakdown or adding clarification notes to an existing task.',
            inputSchema: TASK_ID_INPUT_SCHEMA,
            execute: async (input) =>
                (await services.get(GetTask).executeWithNotes(input.taskId)) || { error: 'Task not found' },
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
                const { taskId, ...data } = input;
                return (await services.get(UpdateTask).execute(taskId, data)) || { error: 'Task not found' };
            },
        }),
        jsonTool({
            name: 'delete_task',
            description: 'Permanently delete a task.',
            inputSchema: TASK_ID_INPUT_SCHEMA,
            execute: async (input) =>
                (await services.get(DeleteTask).execute(input.taskId))
                    ? { message: 'Task deleted' }
                    : { error: 'Task not found' },
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
            execute: async (input) =>
                services.get(AddTaskNote).execute(input.taskId, input.content, input.type),
        }),
    ];
}

async function createTaskWithSimilarityCheck(
    services: ServiceProvider,
    input: ToolInput,
): Promise<Record<string, unknown>> {
    const similarTasks = await findSimilarTaskMatches(services, input.title);
    const task = await services.get(CreateTask).execute({
        title: input.title,
        description: input.description,
        priority: input.priority,
        scheduledDate: input.scheduledDate,
        domain: input.domain,
    });

    const result: Record<string, unknown> = { ...task };

    if (similarTasks.length > 0) {
        result.similarTasks = similarTasks;
        result.warning = `Se encontraron ${similarTasks.length} tarea(s) similares. Avisale al usuario.`;
    }

    return result;
}

async function findSimilarTaskMatches(
    services: ServiceProvider,
    query: string,
): Promise<SimilarTaskMatch[]> {
    try {
        const similarTasks = await services.get(FindSimilarTasks).execute(query, 3, 0.6);
        return similarTasks.map((task) => ({
            content: task.content,
            matchPercent: task.matchPercent,
        }));
    } catch {
        // Embedding search is a non-critical enhancement; task creation should still work.
        return [];
    }
}
