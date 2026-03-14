import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./system-prompt";
import { toolDefinitions, executeTool } from "./tools";
import { db } from "@vdp/db";
import { agentConversations, agentMessages } from "@vdp/db";
import { eq, asc } from "drizzle-orm";

const anthropic = new Anthropic();

interface ChatOptions {
  message: string;
  conversationId?: string;
  onText: (text: string) => void;
  onToolUse: (tool: string, input: any) => void;
  onToolResult: (tool: string, result: string) => void;
  onDone: (conversationId: string) => void;
  onError: (error: string) => void;
}

export async function chat(options: ChatOptions) {
  const { message, onText, onToolUse, onToolResult, onDone, onError } = options;

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

    // Agent loop
    let continueLoop = true;
    while (continueLoop) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: toolDefinitions,
        messages,
      });

      let assistantText = "";
      const toolCalls: any[] = [];

      for (const block of response.content) {
        if (block.type === "text") {
          assistantText += block.text;
          onText(block.text);
        } else if (block.type === "tool_use") {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input,
          });
        }
      }

      // Save assistant message
      await db.insert(agentMessages).values({
        conversationId,
        role: "assistant",
        content: assistantText || null,
        toolCalls: toolCalls.length > 0 ? toolCalls : null,
      });

      // If there are tool calls, execute them
      if (toolCalls.length > 0) {
        // Add assistant message to conversation
        messages.push({
          role: "assistant",
          content: response.content,
        });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const tc of toolCalls) {
          onToolUse(tc.name, tc.input);
          try {
            const result = await executeTool(tc.name, tc.input);
            onToolResult(tc.name, result);

            // Save tool result
            await db.insert(agentMessages).values({
              conversationId,
              role: "tool",
              toolResult: {
                tool_use_id: tc.id,
                content: result,
              },
            });

            toolResults.push({
              type: "tool_result",
              tool_use_id: tc.id,
              content: result,
            });
          } catch (err: any) {
            const errorMsg = err.message || "Tool execution failed";
            onToolResult(tc.name, JSON.stringify({ error: errorMsg }));

            await db.insert(agentMessages).values({
              conversationId,
              role: "tool",
              toolResult: {
                tool_use_id: tc.id,
                content: JSON.stringify({ error: errorMsg }),
              },
            });

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

      // Stop if no more tool calls
      if (response.stop_reason === "end_turn" || toolCalls.length === 0) {
        continueLoop = false;
      }
    }

    onDone(conversationId);
  } catch (err: any) {
    onError(err.message || "Agent error");
  }
}
