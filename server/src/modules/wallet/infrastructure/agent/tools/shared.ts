import { AgentTool } from '../../../../common/base/agents/BaseAgent';

export const ACCOUNT_TYPES = ['cash', 'bank', 'crypto', 'investment'] as const;
export const TRANSACTION_TYPES = ['income', 'expense', 'transfer'] as const;
export const CURRENCIES = ['ARS', 'USD'] as const;

export const ACCOUNT_ID_SCHEMA = {
    type: 'object',
    properties: {
        accountId: { type: 'string', description: 'Account ID (UUID)' },
    },
    required: ['accountId'],
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- LLM tool inputs are validated by JSON schema at the provider level
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
