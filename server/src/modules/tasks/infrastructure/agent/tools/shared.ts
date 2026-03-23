import { AgentTool } from '../../../../common/base/agents/BaseAgent';

export const TASK_STATUSES = ['pending', 'done', 'discarded'] as const;
export const TASK_DOMAINS = ['wallet', 'health', 'work', 'people', 'study'] as const;
export const TASK_PRIORITIES = [1, 2, 3] as const;
export const TASK_NOTE_TYPES = ['note', 'breakdown_step', 'blocker'] as const;

export const EMPTY_OBJECT_SCHEMA = {
    type: 'object',
    properties: {},
    required: [],
} as const;

export const TASK_ID_INPUT_SCHEMA = {
    type: 'object',
    properties: {
        taskId: { type: 'string', description: 'Task ID' },
    },
    required: ['taskId'],
} as const;

export type ToolInput = Record<string, any>;

type JsonToolDefinition = {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    execute: (input: ToolInput) => Promise<unknown> | unknown;
};

export function jsonTool(definition: JsonToolDefinition): AgentTool {
    return {
        name: definition.name,
        description: definition.description,
        inputSchema: definition.inputSchema,
        execute: async (input) => JSON.stringify(await definition.execute(input)),
    };
}
