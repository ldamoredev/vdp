import { randomUUID } from 'crypto';
import { AgentProvider } from './AgentProvider';
import { AgentMessage, AgentProviderRequest, AgentProviderResponse, AgentToolCall } from './types';
import { AgentError } from '../AgentError';

type OllamaToolCall = {
    id?: string;
    type?: 'function';
    function?: {
        name?: string;
        arguments?: string;
    };
};

type OllamaChatCompletionResponse = {
    usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
    };
    choices?: Array<{
        finish_reason?: string | null;
        message?: {
            content?: string | null;
            tool_calls?: OllamaToolCall[];
        };
    }>;
};

export class OllamaAgentProvider implements AgentProvider {
    readonly name = 'ollama';
    readonly defaultModel = process.env.AGENT_MODEL || 'qwen3:4b';

    constructor(
        private readonly baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    ) {}

    async generate(request: AgentProviderRequest): Promise<AgentProviderResponse> {
        const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
            throw AgentError.providerUnavailable(`Ollama request failed (${response.status}): ${body}`);
        }

        const payload = await response.json() as OllamaChatCompletionResponse;
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

    private parseToolCall(toolCall: OllamaToolCall): AgentToolCall {
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
