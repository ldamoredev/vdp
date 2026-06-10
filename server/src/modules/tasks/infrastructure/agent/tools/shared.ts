import { localDateStringSchema, type TasksAgentToolName } from '@vdp/shared';

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
    // Constrained to the shared registry so the web client can rely on it.
    name: TasksAgentToolName;
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

/**
 * Validate optional YYYY-MM-DD date fields coming from LLM tool input.
 *
 * Agent tools call services directly and skip the HTTP Zod layer, so a date the
 * model invents (e.g. "tomorrow", "2026-13-40") would otherwise reach the
 * repository and silently corrupt day-based grouping/carry-over. Returns an
 * error object to surface back to the model, or null when every field is valid.
 */
export function invalidDateError(
    input: ToolInput,
    fields: readonly string[],
): { error: string } | null {
    for (const field of fields) {
        const value = input[field];
        if (value === undefined || value === null) continue;
        if (!localDateStringSchema.safeParse(value).success) {
            return {
                error: `Invalid ${field}: expected a YYYY-MM-DD date, got ${JSON.stringify(value)}`,
            };
        }
    }
    return null;
}
