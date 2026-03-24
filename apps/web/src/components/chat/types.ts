import type { ToolActionView } from "@/lib/chat/tool-actions";

export interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  action?: ToolActionView;
  pending?: boolean;
  toolInput?: Record<string, unknown>;
  traceUrl?: string;
}

export type DomainConversationState = {
  messages: Message[];
  conversationId?: string;
};
