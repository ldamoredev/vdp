import Anthropic from "@anthropic-ai/sdk";
import type { EventBus, DomainEvent, DomainName } from "../core/event-bus/index.js";
import type { SkillRegistry } from "../skills/registry.js";

export interface AgentTool {
  name: string;
  description: string;
  inputSchema: Anthropic.Tool["input_schema"];
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
 * Provides:
 * - Chat interface with tool use loop
 * - Event handling
 * - Proactive evaluation
 * - Access to event bus, skills, and memory
 *
 * Each domain agent must implement:
 * - domain: which domain it belongs to
 * - systemPrompt: the agent's personality and instructions
 * - tools: the tools the agent can use
 */
export abstract class BaseAgent {
  abstract readonly domain: DomainName;
  abstract readonly systemPrompt: string;
  abstract readonly tools: AgentTool[];

  protected anthropic: Anthropic;
  protected eventBus: EventBus;
  protected skills: SkillRegistry;
  protected model = "claude-sonnet-4-20250514";
  protected maxTokens = 4096;

  constructor(deps: {
    eventBus: EventBus;
    skills: SkillRegistry;
  }) {
    this.anthropic = new Anthropic();
    this.eventBus = deps.eventBus;
    this.skills = deps.skills;
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
      return JSON.stringify({ error: err.message || "Tool execution failed" });
    }
  }

  /**
   * Run the agent chat loop with tool use.
   * Takes pre-built messages array and callbacks.
   */
  async runLoop(
    messages: Anthropic.MessageParam[],
    callbacks: ChatCallbacks & { conversationId: string }
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

        let assistantText = "";
        const toolCalls: Array<{ id: string; name: string; input: any }> = [];

        for (const block of response.content) {
          if (block.type === "text") {
            assistantText += block.text;
            callbacks.onText(block.text);
          } else if (block.type === "tool_use") {
            toolCalls.push({
              id: block.id,
              name: block.name,
              input: block.input,
            });
          }
        }

        // Yield the assistant content + tool calls for persistence
        await this.onAssistantMessage(
          callbacks.conversationId,
          assistantText,
          toolCalls
        );

        if (toolCalls.length > 0) {
          messages.push({ role: "assistant", content: response.content });
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const tc of toolCalls) {
            callbacks.onToolUse(tc.name, tc.input);
            try {
              const result = await this.executeTool(tc.name, tc.input);
              callbacks.onToolResult(tc.name, result);

              await this.onToolResult(callbacks.conversationId, tc.id, result);

              toolResults.push({
                type: "tool_result",
                tool_use_id: tc.id,
                content: result,
              });
            } catch (err: any) {
              const errorMsg = err.message || "Tool execution failed";
              callbacks.onToolResult(tc.name, JSON.stringify({ error: errorMsg }));

              await this.onToolResult(
                callbacks.conversationId,
                tc.id,
                JSON.stringify({ error: errorMsg }),
                true
              );

              toolResults.push({
                type: "tool_result",
                tool_use_id: tc.id,
                content: JSON.stringify({ error: errorMsg }),
                is_error: true,
              });
            }
          }

          messages.push({ role: "user", content: toolResults });
        }

        if (response.stop_reason === "end_turn" || toolCalls.length === 0) {
          continueLoop = false;
        }
      }

      callbacks.onDone(callbacks.conversationId);
    } catch (err: any) {
      callbacks.onError(err.message || "Agent error");
    }
  }

  /**
   * Hook for subclasses to persist assistant messages.
   * Override in domain agent to save to DB.
   */
  protected async onAssistantMessage(
    _conversationId: string,
    _text: string,
    _toolCalls: Array<{ id: string; name: string; input: any }>
  ): Promise<void> {
    // Override in subclass
  }

  /**
   * Hook for subclasses to persist tool results.
   * Override in domain agent to save to DB.
   */
  protected async onToolResult(
    _conversationId: string,
    _toolUseId: string,
    _result: string,
    _isError?: boolean
  ): Promise<void> {
    // Override in subclass
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
