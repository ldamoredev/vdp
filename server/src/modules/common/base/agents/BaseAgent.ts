import Anthropic from '@anthropic-ai/sdk';
import { DomainEvent, DomainName } from '../event-bus/DomainEvent';
import { EventBus } from '../event-bus/EventBus';
import { ServiceProvider } from '../services/ServiceProvider';
import { Skill, SkillRegistry } from './skills/SkillRegistry';
import { SummarizeSkill } from './skills/SummarizeSkill';
import { DrizzleAgentRepository } from '../../infrastructure/agents/DrizzleAgentRepository';
import { DrizzleRepositoryProvider } from '../../infrastructure/db/DrizzleRepositoryProvider';

export interface AgentTool {
    name: string;
    description: string;
    inputSchema: Anthropic.Tool['input_schema'];
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
    onDone: (conversationId: string) => void;
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

    protected anthropic: Anthropic;
    protected skills: SkillRegistry = new SkillRegistry();
    protected repositories: DrizzleRepositoryProvider;
    protected services: ServiceProvider;
    protected model = 'claude-sonnet-4-20250514';
    protected maxTokens = 4096;

    constructor(eventBus: EventBus, services: ServiceProvider, repositories: DrizzleRepositoryProvider) {
        this.anthropic = new Anthropic();
        this.services = services;
        this.repositories = repositories;
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
    get toolDefinitions(): Anthropic.Tool[] {
        return this.tools.map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: t.inputSchema,
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

        try {
            // Get or create conversation
            let conversationId = options.conversationId;
            if (!conversationId) {
                const conv = await this.repositories.get(DrizzleAgentRepository).createConversation(this.domain, message.slice(0, 100));
                conversationId = conv.id;
            }

            // Save user message
            await this.repositories.get(DrizzleAgentRepository).createMessage(
                conversationId,
                'user',
                message,
            );

            // Load conversation history
            const history = await this.repositories.get(DrizzleAgentRepository).loadHistory(conversationId);

            // Build messages array for Anthropic
            const messages: Anthropic.MessageParam[] = [];
            for (const msg of history) {
                if (msg.role === 'user') {
                    messages.push({ role: 'user', content: msg.content || '' });
                } else if (msg.role === 'assistant') {
                    const content: Array<Anthropic.TextBlock | Anthropic.ToolUseBlock> = [];
                    if (msg.content) {
                        content.push({ type: 'text', text: msg.content, citations: null });
                    }
                    if (msg.toolCalls) {
                        const calls = msg.toolCalls as any[];
                        for (const tc of calls) {
                            content.push({
                                type: 'tool_use',
                                id: tc.id,
                                name: tc.name,
                                input: tc.input,
                            });
                        }
                    }
                    if (content.length > 0) {
                        messages.push({ role: 'assistant', content });
                    }
                } else if (msg.role === 'tool') {
                    const result = msg.toolResult as any;
                    messages.push({
                        role: 'user',
                        content: [
                            {
                                type: 'tool_result',
                                tool_use_id: result.tool_use_id,
                                content: result.content,
                            },
                        ],
                    });
                }
            }

            // Run the agent loop
            await this.runLoop(messages, {
                conversationId,
                ...callbacks,
            });
        } catch (err: any) {
            callbacks.onError(err.message || 'Agent error');
        }
    }

    /**
     * Run the agent chat loop with tool use.
     * Takes pre-built messages array and callbacks.
     */
    async runLoop(
        messages: Anthropic.MessageParam[],
        callbacks: ChatCallbacks & { conversationId: string },
    ): Promise<void> {
        try {
            let continueLoop = true;

            while (continueLoop) {
                const response = await this.anthropic.messages.create({
                    model: this.model,
                    max_tokens: this.maxTokens,
                    system: this.systemPrompt,
                    tools: this.toolDefinitions,
                    messages,
                });

                let assistantText = '';
                const toolCalls: Array<{ id: string; name: string; input: any }> = [];

                for (const block of response.content) {
                    if (block.type === 'text') {
                        assistantText += block.text;
                        callbacks.onText(block.text);
                    } else if (block.type === 'tool_use') {
                        toolCalls.push({
                            id: block.id,
                            name: block.name,
                            input: block.input,
                        });
                    }
                }

                // Persist assistant message
                await this.repositories.get(DrizzleAgentRepository).createAgentMessage(
                    callbacks.conversationId,
                    'assistant',
                    assistantText || null,
                    toolCalls.length > 0 ? toolCalls : null,
                );

                if (toolCalls.length > 0) {
                    messages.push({ role: 'assistant', content: response.content });
                    const toolResults: Anthropic.ToolResultBlockParam[] = [];

                    for (const tc of toolCalls) {
                        callbacks.onToolUse(tc.name, tc.input);
                        try {
                            const result = await this.executeTool(tc.name, tc.input);
                            callbacks.onToolResult(tc.name, result);

                            // Persist tool result
                            await this.repositories.get(DrizzleAgentRepository).saveToolResult(
                                callbacks.conversationId,
                                'tool',
                                { tool_use_id: tc.id, content: result },
                            );

                            toolResults.push({
                                type: 'tool_result',
                                tool_use_id: tc.id,
                                content: result,
                            });
                        } catch (err: any) {
                            const errorMsg = err.message || 'Tool execution failed';
                            callbacks.onToolResult(tc.name, JSON.stringify({ error: errorMsg }));

                            await this.repositories.get(DrizzleAgentRepository).saveToolResult(
                                callbacks.conversationId,
                                'tool',
                                { tool_use_id: tc.id, content: JSON.stringify({ error: errorMsg }), }
                            );

                            toolResults.push({
                                type: 'tool_result',
                                tool_use_id: tc.id,
                                content: JSON.stringify({ error: errorMsg }),
                                is_error: true,
                            });
                        }
                    }

                    messages.push({ role: 'user', content: toolResults });
                }

                if (response.stop_reason === 'end_turn' || toolCalls.length === 0) {
                    continueLoop = false;
                }
            }

            callbacks.onDone(callbacks.conversationId);
        } catch (err: any) {
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
}
