import Anthropic from "@anthropic-ai/sdk";
import { BaseAgent, type AgentTool, type ChatCallbacks } from '../../../agents';
import type { DomainName } from '../../../core/event-bus';
import { db } from "../../../core/db/client.js";
import { agentConversations, agentMessages } from "../schema.js";
import { eq, asc } from "drizzle-orm";
import { WALLET_SYSTEM_PROMPT } from "./system-prompt.js";
import { createWalletTools } from "./tools.js";

export class WalletAgent extends BaseAgent {
  readonly domain: DomainName = "wallet";
  readonly systemPrompt = WALLET_SYSTEM_PROMPT;
  readonly tools: AgentTool[];

  constructor(deps: ConstructorParameters<typeof BaseAgent>[0]) {
    super(deps);
    this.tools = createWalletTools();
  }

  /**
   * Full chat flow: manage conversation persistence + run the agent loop.
   */
  async chat(options: {
    message: string;
    conversationId?: string;
    callbacks: Omit<ChatCallbacks, "onDone" | "onError"> & {
      onDone: (conversationId: string) => void;
      onError: (error: string) => void;
    };
  }): Promise<void> {
    const { message, callbacks } = options;

    try {
      // Get or create conversation
      let conversationId = options.conversationId;
      if (!conversationId) {
        const [conv] = await db
          .insert(agentConversations)
          .values({ title: message.slice(0, 100) })
          .returning();
        conversationId = conv.id;
      }

      // Save user message
      await db.insert(agentMessages).values({
        conversationId,
        role: "user",
        content: message,
      });

      // Load conversation history
      const history = await db
        .select()
        .from(agentMessages)
        .where(eq(agentMessages.conversationId, conversationId))
        .orderBy(asc(agentMessages.createdAt));

      // Build messages array for Anthropic
      const messages: Anthropic.MessageParam[] = [];
      for (const msg of history) {
        if (msg.role === "user") {
          messages.push({ role: "user", content: msg.content || "" });
        } else if (msg.role === "assistant") {
          const content: Anthropic.ContentBlock[] = [];
          if (msg.content) content.push({ type: "text", text: msg.content });
          if (msg.toolCalls) {
            const calls = msg.toolCalls as any[];
            for (const tc of calls) {
              content.push({
                type: "tool_use",
                id: tc.id,
                name: tc.name,
                input: tc.input,
              });
            }
          }
          if (content.length > 0) {
            messages.push({ role: "assistant", content });
          }
        } else if (msg.role === "tool") {
          const result = msg.toolResult as any;
          messages.push({
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: result.tool_use_id,
                content: result.content,
              },
            ],
          });
        }
      }

      // Run the agent loop (from BaseAgent)
      await this.runLoop(messages, {
        conversationId,
        ...callbacks,
      });
    } catch (err: any) {
      callbacks.onError(err.message || "Agent error");
    }
  }

  /**
   * Persist assistant messages to DB.
   */
  protected override async onAssistantMessage(
    conversationId: string,
    text: string,
    toolCalls: Array<{ id: string; name: string; input: any }>
  ): Promise<void> {
    await db.insert(agentMessages).values({
      conversationId,
      role: "assistant",
      content: text || null,
      toolCalls: toolCalls.length > 0 ? toolCalls : null,
    });
  }

  /**
   * Persist tool results to DB.
   */
  protected override async onToolResult(
    conversationId: string,
    toolUseId: string,
    result: string,
    _isError?: boolean
  ): Promise<void> {
    await db.insert(agentMessages).values({
      conversationId,
      role: "tool",
      toolResult: {
        tool_use_id: toolUseId,
        content: result,
      },
    });
  }
}
