import { AgentMessage, AgentProviderResponse, AgentToolCall, AgentToolDefinition, AgentToolResult } from './providers/types';
import { TraceService } from '../observability/trace/TraceService';
import { AgentProvider } from './providers/AgentProvider';
import { Trace } from '../observability/trace/LLMTraceService';
import { DomainName } from '../event-bus/DomainEvent';

export class AgentChatLoop {
    constructor(private readonly deps: AgentChatLoopDependencies) {}

    async run(
        messages: AgentMessage[],
        callbacks: AgentLoopCallbacks,
        trace: Trace,
    ): Promise<void> {
        let continueLoop = true;

        while (continueLoop) {
            const response = await this.generate(messages, trace);

            if (response.text) {
                callbacks.onText(response.text);
            }

            await this.deps.onAssistantMessage(response);
            this.appendAssistantMessage(messages, response);

            if (response.toolCalls.length > 0) {
                await this.handleToolCalls(messages, callbacks, trace, response.toolCalls);
            }

            continueLoop = !(
                response.toolCalls.length === 0 ||
                response.stopReason === 'end_turn' ||
                response.stopReason === 'stop'
            );
        }
    }

    private async generate(messages: AgentMessage[], trace: Trace): Promise<AgentProviderResponse> {
        const generation = trace.generation({
            name: 'agent.generate',
            model: this.deps.model,
            input: messages,
            metadata: {
                domain: this.deps.domain,
                provider: this.deps.provider.name,
                promptHash: this.deps.hashPrompt(this.deps.systemPrompt),
                toolCount: this.deps.toolDefinitions.length,
            },
        });

        try {
            const response = await this.deps.traceService.runWithSpan(
                'agent.provider.generate',
                {
                    attributes: {
                        domain: this.deps.domain,
                        provider: this.deps.provider.name,
                        model: this.deps.model,
                        tool_count: this.deps.toolDefinitions.length,
                    },
                },
                async (span) => {
                    const providerResponse = await this.deps.provider.generate({
                        model: this.deps.model,
                        maxTokens: this.deps.maxTokens,
                        systemPrompt: this.deps.systemPrompt,
                        tools: this.deps.toolDefinitions,
                        messages,
                    });

                    span.setAttributes({
                        stop_reason: providerResponse.stopReason,
                        input_tokens: providerResponse.usage?.inputTokens,
                        output_tokens: providerResponse.usage?.outputTokens,
                    });

                    return providerResponse;
                },
            );

            generation.end({
                output: {
                    text: response.text,
                    stopReason: response.stopReason,
                    toolCalls: response.toolCalls.map((toolCall) => ({
                        id: toolCall.id,
                        name: toolCall.name,
                    })),
                },
                usage: response.usage,
            });

            return response;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Agent generation failed';
            generation.end({
                output: {
                    error: message,
                },
            });
            throw err;
        }
    }

    private appendAssistantMessage(messages: AgentMessage[], response: AgentProviderResponse): void {
        messages.push({
            role: 'assistant',
            content: response.text || null,
            ...(response.toolCalls.length > 0 ? { toolCalls: response.toolCalls } : {}),
        });
    }

    private async handleToolCalls(
        messages: AgentMessage[],
        callbacks: AgentLoopCallbacks,
        trace: Trace,
        toolCalls: AgentToolCall[],
    ): Promise<void> {
        for (const toolCall of toolCalls) {
            callbacks.onToolUse(toolCall.name, toolCall.input);
            const toolSpan = trace.span({
                name: 'agent.tool',
                metadata: {
                    tool: toolCall.name,
                    input: toolCall.input,
                },
            });

            const toolResult = await this.deps.executeToolCall(toolCall);
            toolSpan.end({
                output: toolResult.content,
                isError: toolResult.is_error ?? false,
            });

            callbacks.onToolResult(toolCall.name, toolResult.content);
            await this.deps.onToolResultPersisted(toolResult);

            messages.push({ role: 'tool', toolResult});
        }
    }
}

export type AgentLoopCallbacks = {
    onText: (text: string) => void;
    onToolUse: (tool: string, input: unknown) => void;
    onToolResult: (tool: string, result: string) => void;
};

type AgentChatLoopDependencies = {
    domain: DomainName;
    systemPrompt: string;
    model: string;
    maxTokens: number;
    provider: AgentProvider;
    traceService: TraceService;
    toolDefinitions: AgentToolDefinition[];
    executeToolCall: (toolCall: AgentToolCall) => Promise<AgentToolResult>;
    onAssistantMessage: (response: AgentProviderResponse) => Promise<void>;
    onToolResultPersisted: (toolResult: AgentToolResult) => Promise<void>;
    hashPrompt: (text: string) => string;
};
