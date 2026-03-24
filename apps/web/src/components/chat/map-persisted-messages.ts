import type { AgentMessageRecord } from "@/lib/api/types";
import { parseToolAction } from "@/lib/chat/tool-actions";
import type { Message } from "./types";

export function mapPersistedMessages(records: AgentMessageRecord[]): Message[] {
  const messages: Message[] = [];
  const toolNameById = new Map<string, string>();

  for (const record of records) {
    if (record.role === "user" && record.content) {
      messages.push({
        id: record.id,
        role: "user",
        content: record.content,
      });
      continue;
    }

    if (record.role === "assistant") {
      if (Array.isArray(record.toolCalls)) {
        for (const toolCall of record.toolCalls) {
          toolNameById.set(toolCall.id, toolCall.name);
        }
      }

      if (record.content) {
        messages.push({
          id: record.id,
          role: "assistant",
          content: record.content,
        });
      }
      continue;
    }

    if (record.role === "tool" && record.toolResult) {
      const toolName =
        toolNameById.get(record.toolResult.tool_use_id) || "herramienta";
      const action = parseToolAction(toolName, record.toolResult.content);
      messages.push({
        id: record.id,
        role: "tool",
        toolName,
        action,
        content: action.detail || action.title,
      });
    }
  }

  return messages;
}
