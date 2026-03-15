import Anthropic from "@anthropic-ai/sdk";
import { BaseAgent, type AgentTool, type ChatCallbacks } from "../../../agents/base-agent.js";
import type { DomainName } from "../../../core/event-bus/index.js";
import { db } from "../../../core/db/client.js";
import { healthAgentConversations, healthAgentMessages } from "../schema.js";
import { eq, asc } from "drizzle-orm";
import { HEALTH_SYSTEM_PROMPT } from "./system-prompt.js";
import { createHealthTools } from "./tools.js";

export class HealthAgent extends BaseAgent {
  readonly domain: DomainName = "health";
  readonly systemPrompt = HEALTH_SYSTEM_PROMPT;
  readonly tools: AgentTool[];

  constructor(deps: ConstructorParameters<typeof BaseAgent>[0]) {
    super(deps);
    this.tools = createHealthTools();
  }

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
      let conversationId = options.conversationId;
      if (!conversationId) {
        const [conv] = await db
          .insert(healthAgentConversations)
          .values({ title: message.slice(0, 100) })
          .returning();
        conversationId = conv.id;
      }

      await db.insert(healthAgentMessages).values({
        conversationId,
        role: "user",
        content: message,
      });

      const history = await db
        .select()
        .from(healthAgentMessages)
        .where(eq(healthAgentMessages.conversationId, conversationId))
        .orderBy(asc(healthAgentMessages.createdAt));

      const messages: Anthropic.MessageParam[] = [];
      for (const msg of history) {
        if (msg.role === "user") {
          messages.push({ role: "user", content: msg.content || "" });
        } else if (msg.role === "assistant") {
          const content: Anthropic.ContentBlock[] = [];
          if (msg.content) content.push({ type: "text", text: msg.content });
          if (msg.toolCalls) {
            const calls = JSON.parse(msg.toolCalls);
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
          const result = JSON.parse(msg.toolResult!);
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

      await this.runLoop(messages, {
        conversationId,
        ...callbacks,
      });
    } catch (err: any) {
      callbacks.onError(err.message || "Agent error");
    }
  }

  protected override async onAssistantMessage(
    conversationId: string,
    text: string,
    toolCalls: Array<{ id: string; name: string; input: any }>
  ): Promise<void> {
    await db.insert(healthAgentMessages).values({
      conversationId,
      role: "assistant",
      content: text || null,
      toolCalls: toolCalls.length > 0 ? JSON.stringify(toolCalls) : null,
    });
  }

  protected override async onToolResult(
    conversationId: string,
    toolUseId: string,
    result: string,
    _isError?: boolean
  ): Promise<void> {
    await db.insert(healthAgentMessages).values({
      conversationId,
      role: "tool",
      toolResult: JSON.stringify({
        tool_use_id: toolUseId,
        content: result,
      }),
    });
  }
}
