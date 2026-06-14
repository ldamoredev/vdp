import { useQuery } from "@tanstack/react-query";

export type AgentChatUnavailableReason =
  | "agent_provider_not_configured"
  | "anthropic_not_configured"
  | "openai_compatible_not_configured"
  | "ollama_not_configured"
  | "agent_status_unavailable";

export type AgentChatStatus =
  | { enabled: true }
  | { enabled: false; reason: AgentChatUnavailableReason | string };

export function normalizeAgentChatStatus(payload: unknown): AgentChatStatus {
  const status = (payload as { agentChat?: { enabled?: unknown; reason?: unknown } } | null)?.agentChat;

  if (status?.enabled === true) {
    return { enabled: true };
  }

  if (status?.enabled === false && typeof status.reason === "string") {
    return { enabled: false, reason: status.reason };
  }

  return { enabled: false, reason: "agent_status_unavailable" };
}

export async function fetchAgentChatStatus(): Promise<AgentChatStatus> {
  const response = await fetch("/api/health", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    return { enabled: false, reason: "agent_status_unavailable" };
  }

  return normalizeAgentChatStatus(await response.json().catch(() => null));
}

export function useAgentChatStatus(): AgentChatStatus & { isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["agent-chat-status"],
    queryFn: fetchAgentChatStatus,
    staleTime: 60_000,
    retry: false,
  });

  return {
    ...(data ?? { enabled: false as const, reason: "agent_status_unavailable" }),
    isLoading,
  };
}

export function agentChatDisabledMessage(status: AgentChatStatus): string {
  if (status.enabled) return "";
  if (status.reason === "agent_status_unavailable") {
    return "No se pudo confirmar la configuracion del chat IA.";
  }
  return "Chat IA desactivado en este entorno.";
}
