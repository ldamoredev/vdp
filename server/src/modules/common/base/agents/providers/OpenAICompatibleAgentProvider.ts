import { randomUUID } from 'crypto';
import { AgentProvider } from './AgentProvider';
import { AgentMessage, AgentProviderRequest, AgentProviderResponse, AgentToolCall } from './types';
import { AgentError } from '../AgentError';

type OpenAIToolCall = {
    id?: string;
    type?: 'function';
    function?: {
        name?: string;
        arguments?: string;
    };
};

type OpenAIChatCompletionResponse = {
    usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
    };
    choices?: Array<{
        finish_reason?: string | null;
        message?: {
            content?: string | null;
            tool_calls?: OpenAIToolCall[];
        };
    }>;
};

export type OpenAICompatibleConfig = {
    readonly baseUrl: string;
    readonly apiKey: string;
    readonly model: string;
};

export class OpenAICompatibleAgentProvider implements AgentProvider {
    readonly name = 'openai-compatible';
    readonly defaultModel: string;

    constructor(private readonly config: OpenAICompatibleConfig) {
        if (!config.apiKey) {
            throw new Error('OPENAI_COMPAT_API_KEY is required when AGENT_PROVIDER=openai-compatible');
        }
        if (!config.baseUrl) {
            throw new Error('OPENAI_COMPAT_BASE_URL is required when AGENT_PROVIDER=openai-compatible');
        }
        this.defaultModel = config.model;
    }

    async generate(request: AgentProviderRequest): Promise<AgentProviderResponse> {
        const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
                model: request.model,
                messages: request.messages.map((message) => this.toOpenAIMessage(message)),
                tools: request.tools.map((tool) => ({
                    type: 'function',
                    function: {
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.inputSchema,
                    },
                })),
                stream: false,
            }),
        });

        if (!response.ok) {
            const body = await response.text();
            throw AgentError.providerUnavailable(`OpenAI-compatible request failed (${response.status}): ${body}`);
        }

        const payload = await response.json() as OpenAIChatCompletionResponse;
        const choice = payload.choices?.[0];
        const message = choice?.message;

        return {
            text: message?.content ?? '',
            toolCalls: (message?.tool_calls ?? []).map((toolCall) => this.parseToolCall(toolCall)),
            stopReason: choice?.finish_reason ?? 'stop',
            usage: payload.usage
                ? {
                    inputTokens: payload.usage.prompt_tokens,
                    outputTokens: payload.usage.completion_tokens,
                }
                : undefined,
        };
    }

    private toOpenAIMessage(message: AgentMessage) {
        if (message.role === 'user') {
            return {
                role: 'user',
                content: message.content,
            };
        }

        if (message.role === 'assistant') {
            return {
                role: 'assistant',
                content: message.content ?? '',
                ...(message.toolCalls && message.toolCalls.length > 0
                    ? {
                        tool_calls: message.toolCalls.map((toolCall) => ({
                            id: toolCall.id,
                            type: 'function',
                            function: {
                                name: toolCall.name,
                                arguments: JSON.stringify(toolCall.input),
                            },
                        })),
                    }
                    : {}),
            };
        }

        return {
            role: 'tool',
            tool_call_id: message.toolResult.tool_use_id,
            content: message.toolResult.content,
        };
    }

    private parseToolCall(toolCall: OpenAIToolCall): AgentToolCall {
        return {
            id: toolCall.id || randomUUID(),
            name: toolCall.function?.name || 'unknown_tool',
            input: this.parseArguments(toolCall.function?.arguments),
        };
    }

    private parseArguments(value?: string): Record<string, unknown> {
        if (!value) return {};

        try {
            const parsed = JSON.parse(value) as unknown;
            return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
        } catch {
            return {};
        }
    }
}
