import { DomainEvent, DomainName } from '../event-bus/DomainEvent';
import { EventBus } from '../event-bus/EventBus';
import { ServiceProvider } from '../services/ServiceProvider';
import { Skill, SkillRegistry } from './skills/SkillRegistry';
import { SummarizeSkill } from './skills/SummarizeSkill';
import { AgentProvider } from './providers/AgentProvider';
import { AgentMessage, AgentToolCall, AgentToolDefinition, AgentToolResult } from './providers/types';
import { LLMTraceService, Trace } from '../observability/trace/LLMTraceService';
import { TraceService } from '../observability/trace/TraceService';
import { createHash } from 'crypto';
import { RepositoryProvider } from '../db/RepositoryProvider';
import { Logger } from '../observability/logging/Logger';
import { AgentConversationStore } from './AgentConversationStore';
import { AgentChatLoop } from './AgentChatLoop';

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
    protected conversationStore: AgentConversationStore;
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
        this.conversationStore = new AgentConversationStore(repositories);
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
            const conversationId = await this.conversationStore.ensureConversation(
                this.domain,
                message,
                options.conversationId,
            );

            trace.update({ conversationId });

            await this.conversationStore.saveUserMessage(conversationId, message);
            const messages = await this.conversationStore.loadMessages(conversationId);

            await this.runLoop(messages, { conversationId, ...callbacks }, trace);
        } catch (err: any) {
            trace.update({ error: err.message || 'Agent error' });
            callbacks.onError(err.message || 'Agent error');
        }
    }

    /**
     * Run the agent chat loop with tool use.
     * Takes pre-built messages array and callbacks.
     */
    protected async runLoop(
        messages: AgentMessage[],
        callbacks: ChatCallbacks & { conversationId: string },
        trace: Trace,
    ): Promise<void> {
        try {
            const loop = new AgentChatLoop({
                domain: this.domain,
                systemPrompt: this.systemPrompt,
                model: this.model,
                maxTokens: this.maxTokens,
                provider: this.provider,
                traceService: this.traceService,
                toolDefinitions: this.toolDefinitions,
                executeToolCall: (toolCall) => this.executeToolCall(toolCall),
                onAssistantMessage: (response) =>
                    this.conversationStore.saveAssistantMessage(
                        callbacks.conversationId,
                        response.text || null,
                        response.toolCalls,
                    ),
                onToolResultPersisted: (toolResult) =>
                    this.conversationStore.saveToolResult(callbacks.conversationId, toolResult),
                hashPrompt: (text) => this.hashPrompt(text),
            });

            await loop.run(messages, callbacks, trace);

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

    private async executeToolCall(toolCall: AgentToolCall): Promise<AgentToolResult> {
        try {
            const result = await this.executeTool(toolCall.name, toolCall.input);
            return { tool_use_id: toolCall.id, content: result };
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
