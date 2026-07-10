import type { AgentMessageRecord } from "./agent-api";
import { parseToolAction } from "@/ui/chat/tool-actions";
import { parseProjectTaskProposal } from "@/ui/chat/project-task-proposal";
import type { Message } from "./types";

export function mapPersistedMessages(records: AgentMessageRecord[]): Message[] {
  const messages: Message[] = [];
  const toolById = new Map<string, { name: string; input: Record<string, unknown> }>();

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
          toolById.set(toolCall.id, {
            name: toolCall.name,
            input: toolCall.input,
          });
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
      const tool = toolById.get(record.toolResult.tool_use_id);
      const toolName = tool?.name || "herramienta";
      const action = parseToolAction(toolName, record.toolResult.content);
      const proposal =
        toolName === "propose_project_tasks"
          ? parseProjectTaskProposal(record.toolResult.content)
          : null;
      messages.push({
        id: record.id,
        role: "tool",
        toolName,
        ...(tool ? { toolInput: tool.input } : {}),
        action,
        content: action.detail || action.title,
        ...(proposal ? { proposal } : {}),
      });
    }
  }

  return messages;
}
