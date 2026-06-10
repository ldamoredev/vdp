import { request } from "@/lib/api/client";

// Wire shapes of the core agent conversation routes. Candidates to move to
// @vdp/shared once the server core exposes a typed contract for them.
export interface AgentConversation {
  id: string;
  domain: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentToolCallRecord {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AgentToolResultRecord {
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface AgentMessageRecord {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "tool";
  content: string | null;
  toolCalls: AgentToolCallRecord[] | null;
  toolResult: AgentToolResultRecord | null;
  createdAt: string;
}

export function listAgentConversations(agentBasePath: string) {
  return request<AgentConversation[]>(`${agentBasePath}/conversations`);
}

export function getAgentConversationMessages(agentBasePath: string, conversationId: string,) {
  return request<AgentMessageRecord[]>(`${agentBasePath}/conversations/${conversationId}/messages`);
}
