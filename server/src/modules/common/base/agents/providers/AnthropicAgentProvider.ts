import Anthropic from '@anthropic-ai/sdk';
import { AgentProvider } from './AgentProvider';
import { AgentMessage, AgentProviderRequest, AgentProviderResponse, AgentToolCall } from './types';

export class AnthropicAgentProvider implements AgentProvider {
    readonly name = 'anthropic';
    readonly defaultModel = 'claude-sonnet-4-20250514';

    private client: Anthropic;

    constructor(apiKey = process.env.ANTHROPIC_API_KEY) {
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY is required when AGENT_PROVIDER=anthropic');
        }

        this.client = new Anthropic({ apiKey });
    }

    async generate(request: AgentProviderRequest): Promise<AgentProviderResponse> {
        const response = await this.client.messages.create({
            model: request.model,
            max_tokens: request.maxTokens,
            system: request.systemPrompt,
            tools: request.tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                input_schema: tool.inputSchema as Anthropic.Tool['input_schema'],
            })),
            messages: request.messages.map((message) => this.toAnthropicMessage(message)),
        });

        let text = '';
        const toolCalls: AgentToolCall[] = [];

        for (const block of response.content) {
            if (block.type === 'text') {
                text += block.text;
            } else if (block.type === 'tool_use') {
                toolCalls.push({
                    id: block.id,
                    name: block.name,
                    input: block.input as Record<string, any>,
                });
            }
        }

        return {
            text,
            toolCalls,
            stopReason: response.stop_reason ?? 'stop',
            usage: {
                inputTokens: response.usage?.input_tokens,
                outputTokens: response.usage?.output_tokens,
            },
        };
    }

    private toAnthropicMessage(message: AgentMessage): Anthropic.MessageParam {
        if (message.role === 'user') {
            return { role: 'user', content: message.content };
        }

        if (message.role === 'assistant') {
            const content: Array<Anthropic.TextBlock | Anthropic.ToolUseBlock> = [];

            if (message.content) {
                content.push({
                    type: 'text',
                    text: message.content,
                    citations: null,
                });
            }

            for (const toolCall of message.toolCalls ?? []) {
                content.push({
                    type: 'tool_use',
                    id: toolCall.id,
                    name: toolCall.name,
                    input: toolCall.input,
                });
            }

            return { role: 'assistant', content };
        }

        return {
            role: 'user',
            content: [
                {
                    type: 'tool_result',
                    tool_use_id: message.toolResult.tool_use_id,
                    content: message.toolResult.content,
                    ...(message.toolResult.is_error ? { is_error: true } : {}),
                },
            ],
        };
    }
}
