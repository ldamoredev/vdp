import { request } from "./client";
import type { AgentConversation, AgentMessageRecord } from "./types";

export function listAgentConversations(agentBasePath: string) {
  return request<AgentConversation[]>(`${agentBasePath}/conversations`);
}

export function getAgentConversationMessages(
  agentBasePath: string,
  conversationId: string,
) {
  return request<AgentMessageRecord[]>(
    `${agentBasePath}/conversations/${conversationId}/messages`,
  );
}
