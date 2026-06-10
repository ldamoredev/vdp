import type { WalletAgentToolName } from '@vdp/shared';

import { AgentTool } from '../../../../common/base/agents/BaseAgent';

export const ACCOUNT_TYPES = ['cash', 'bank', 'crypto', 'investment'] as const;
export const TRANSACTION_TYPES = ['income', 'expense', 'transfer'] as const;
export const CURRENCIES = ['ARS', 'USD'] as const;
export const INVESTMENT_TYPES = ['plazo_fijo', 'fci', 'cedear', 'crypto', 'bond', 'other'] as const;
export const EXCHANGE_RATE_TYPES = ['official', 'blue', 'mep', 'ccl'] as const;

export const ACCOUNT_ID_SCHEMA = {
    type: 'object',
    properties: {
        accountId: { type: 'string', description: 'Account ID (UUID)' },
    },
    required: ['accountId'],
} as const;

 
export type ToolInput = Record<string, any>;

type JsonToolDefinition = {
    // Constrained to the shared registry so the web client can rely on it.
    name: WalletAgentToolName;
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
