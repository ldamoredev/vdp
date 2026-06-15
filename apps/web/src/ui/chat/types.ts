import type { ToolActionView } from "@/ui/chat/tool-actions";

export interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  action?: ToolActionView;
  pending?: boolean;
  toolInput?: Record<string, unknown>;
  traceUrl?: string;
  interrupted?: boolean;
}

export type DomainConversationState = {
  messages: Message[];
  conversationId?: string;
};
