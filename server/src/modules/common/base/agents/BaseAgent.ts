import { DomainEvent, DomainName } from '../event-bus/DomainEvent';
import { EventBus } from '../event-bus/EventBus';
import { ServiceProvider } from '../services/ServiceProvider';
import { Skill, SkillRegistry } from './skills/SkillRegistry';
import { SummarizeSkill } from './skills/SummarizeSkill';
import { AgentRepository } from './AgentRepository';
import { AgentProvider } from './providers/AgentProvider';
import { AgentMessage, AgentToolCall, AgentToolDefinition, AgentToolResult } from './providers/types';
import { LLMTraceService, Trace } from '../observability/trace/LLMTraceService';
import { TraceService } from '../observability/trace/TraceService';
import { createHash } from 'crypto';
import { RepositoryProvider } from '../db/RepositoryProvider';
import { Logger } from '../observability/logging/Logger';

export interface AgentTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    execute: (input: Record<string, any>) => Promise<string>;
}

export interface AgentContext {
    recentEvents?: DomainEvent[];
    additionalContext?: string;
}

export interface ChatCallbacks {
    onText: (text: string) => void;
    onToolUse: (tool: string, input: any) => void;
    onToolResult: (tool: string, result: string) => void;
    onDone: (conversationId: string, traceId?: string) => void;
    onError: (error: string) => void;
}

/**
 * Base agent class that all domain agents extend.
 *
 * Owns ALL conversation persistence via the shared core schema.
 * Domain agents only provide: domain, systemPrompt, tools.
 */
export abstract class BaseAgent {
    abstract readonly domain: DomainName;
    abstract readonly systemPrompt: string;
    abstract readonly tools: AgentTool[];

    protected skills: SkillRegistry;
    protected repositories: RepositoryProvider;
    protected services: ServiceProvider;
    protected provider: AgentProvider;
    protected llmTraceService: LLMTraceService;
    protected traceService: TraceService;
    protected logger: Logger;
    protected model: string;
    protected maxTokens = 4096;

    constructor(
        eventBus: EventBus,
        services: ServiceProvider,
        repositories: RepositoryProvider,
        provider: AgentProvider,
        llmTraceService: LLMTraceService,
        traceService: TraceService,
        logger: Logger,
    ) {
        this.services = services;
        this.repositories = repositories;
        this.provider = provider;
        this.llmTraceService = llmTraceService;
        this.traceService = traceService;
        this.logger = logger;
        this.skills = new SkillRegistry(logger);
        this.model = process.env.AGENT_MODEL || provider.defaultModel;
        this.registerSkill(new SummarizeSkill());
    }

    registerSkill(skill: Skill) {
        this.skills.register(skill)
    }

    getAllSkills(): Skill[] {
        return this.skills.list();
    }

    /**
     * Get the Anthropic tool definitions from the agent's tools.
     */
    get toolDefinitions(): AgentToolDefinition[] {
        return this.tools.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
        }));
    }

    /**
     * Execute a tool by name.
     */
    async executeTool(name: string, input: Record<string, any>): Promise<string> {
        const tool = this.tools.find((t) => t.name === name);
        if (!tool) return JSON.stringify({ error: `Unknown tool: ${name}` });

        try {
            return await tool.execute(input);
        } catch (err: any) {
            return JSON.stringify({ error: err.message || 'Tool execution failed' });
        }
    }

    /**
     * Full chat flow with conversation persistence.
     * Creates/loads conversation, saves messages, runs the agent loop.
     */
    async chat(options: {
        message: string;
        conversationId?: string;
        callbacks: ChatCallbacks;
    }): Promise<void> {
        const { message, callbacks } = options;
        const trace = this.llmTraceService.createTrace({
            name: `${this.domain}.chat`,
            metadata: {
                domain: this.domain,
                provider: this.provider.name,
                model: this.model,
                promptHash: this.hashPrompt(this.systemPrompt),
                conversationId: options.conversationId,
            },
        });

        try {
            // Get or create conversation
            let conversationId = options.conversationId;
            if (!conversationId) {
                const conv = await this.repositories.get(AgentRepository).createConversation(this.domain, message.slice(0, 100));
                conversationId = conv.id;
            }

            trace.update({ conversationId });

            // Save user message
            await this.repositories.get(AgentRepository).createMessage(
                conversationId,
                'user',
                message,
            );

            // Load conversation history
            const history = await this.repositories.get(AgentRepository).loadHistory(conversationId);

            const messages = this.buildMessages(history);

            // Run the agent loop
            await this.runLoop(messages, {
                conversationId,
                ...callbacks,
            }, trace);
        } catch (err: any) {
            trace.update({ error: err.message || 'Agent error' });
            callbacks.onError(err.message || 'Agent error');
        }
    }

    /**
     * Run the agent chat loop with tool use.
     * Takes pre-built messages array and callbacks.
     */
    async runLoop(
        messages: AgentMessage[],
        callbacks: ChatCallbacks & { conversationId: string },
        trace: Trace,
    ): Promise<void> {
        try {
            let continueLoop = true;

            while (continueLoop) {
                const generation = trace.generation({
                    name: 'agent.generate',
                    model: this.model,
                    input: messages,
                    metadata: {
                        domain: this.domain,
                        provider: this.provider.name,
                        promptHash: this.hashPrompt(this.systemPrompt),
                        toolCount: this.toolDefinitions.length,
                    },
                });

                let response;

                try {
                    response = await this.traceService.runWithSpan(
                        'agent.provider.generate',
                        {
                            attributes: {
                                domain: this.domain,
                                provider: this.provider.name,
                                model: this.model,
                                tool_count: this.toolDefinitions.length,
                            },
                        },
                        async (span) => {
                            const providerResponse = await this.provider.generate({
                                model: this.model,
                                maxTokens: this.maxTokens,
                                systemPrompt: this.systemPrompt,
                                tools: this.toolDefinitions,
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
                } catch (err: any) {
                    generation.end({
                        output: {
                            error: err.message || 'Agent generation failed',
                        },
                    });
                    throw err;
                }

                if (response.text) {
                    callbacks.onText(response.text);
                }

                await this.repositories.get(AgentRepository).createAgentMessage(
                    callbacks.conversationId,
                    'assistant',
                    response.text || null,
                    response.toolCalls.length > 0 ? response.toolCalls : null,
                );

                messages.push({
                    role: 'assistant',
                    content: response.text || null,
                    ...(response.toolCalls.length > 0 ? { toolCalls: response.toolCalls } : {}),
                });

                if (response.toolCalls.length > 0) {
                    for (const tc of response.toolCalls) {
                        callbacks.onToolUse(tc.name, tc.input);
                        const toolSpan = trace.span({
                            name: 'agent.tool',
                            metadata: {
                                tool: tc.name,
                                input: tc.input,
                            },
                        });
                        const toolResult = await this.executeToolCall(tc);
                        toolSpan.end({
                            output: toolResult.content,
                            isError: toolResult.is_error ?? false,
                        });
                        callbacks.onToolResult(tc.name, toolResult.content);

                        await this.repositories.get(AgentRepository).saveToolResult(
                            callbacks.conversationId,
                            'tool',
                            toolResult,
                        );

                        messages.push({
                            role: 'tool',
                            toolResult,
                        });
                    }
                }

                if (response.toolCalls.length === 0 || response.stopReason === 'end_turn' || response.stopReason === 'stop') {
                    continueLoop = false;
                }
            }

            trace.update({ completed: true });
            callbacks.onDone(callbacks.conversationId, trace.id);
        } catch (err: any) {
            trace.update({ error: err.message || 'Agent error' });
            callbacks.onError(err.message || 'Agent error');
        }
    }

    /**
     * Handle an event from another domain.
     * Override in domain agents to react to cross-domain events.
     */
    async handleEvent(_event: DomainEvent): Promise<void> {
        // Override in subclass
    }

    /**
     * Proactive evaluation: agent decides to act without user input.
     * Called by the scheduler on a cron schedule.
     * Override in domain agents to implement proactive behavior.
     */
    async evaluate(_context: AgentContext): Promise<void> {
        // Override in subclass
    }

    private buildMessages(history: Awaited<ReturnType<AgentRepository['loadHistory']>>): AgentMessage[] {
        const messages: AgentMessage[] = [];

        for (const msg of history) {
            if (msg.role === 'user') {
                messages.push({ role: 'user', content: msg.content || '' });
                continue;
            }

            if (msg.role === 'assistant') {
                const toolCalls = Array.isArray(msg.toolCalls) ? msg.toolCalls as AgentToolCall[] : [];

                messages.push({
                    role: 'assistant',
                    content: msg.content,
                    ...(toolCalls.length > 0 ? { toolCalls } : {}),
                });
                continue;
            }

            if (msg.role === 'tool' && msg.toolResult) {
                messages.push({
                    role: 'tool',
                    toolResult: msg.toolResult as AgentToolResult,
                });
            }
        }

        return messages;
    }

    private async executeToolCall(toolCall: AgentToolCall): Promise<AgentToolResult> {
        try {
            const result = await this.executeTool(toolCall.name, toolCall.input);
            return {
                tool_use_id: toolCall.id,
                content: result,
            };
        } catch (err: any) {
            const errorMsg = err.message || 'Tool execution failed';
            return {
                tool_use_id: toolCall.id,
                content: JSON.stringify({ error: errorMsg }),
                is_error: true,
            };
        }
    }

    private hashPrompt(text: string): string {
        return createHash('sha256')
            .update(text)
            .digest('hex')
            .slice(0, 8);
    }
}
