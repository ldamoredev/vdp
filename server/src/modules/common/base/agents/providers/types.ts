export type AgentToolDefinition = {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
};

export type AgentToolCall = {
    id: string;
    name: string;
    input: Record<string, any>;
};

export type AgentToolResult = {
    tool_use_id: string;
    content: string;
    is_error?: boolean;
};

export type AgentMessage =
    | {
        role: 'user';
        content: string;
    }
    | {
        role: 'assistant';
        content: string | null;
        toolCalls?: AgentToolCall[];
    }
    | {
        role: 'tool';
        toolResult: AgentToolResult;
    };

export type AgentProviderRequest = {
    systemPrompt: string;
    tools: AgentToolDefinition[];
    messages: AgentMessage[];
    model: string;
    maxTokens: number;
};

export type AgentProviderResponse = {
    text: string;
    toolCalls: AgentToolCall[];
    stopReason: string;
};
