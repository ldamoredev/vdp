import {
  getToolDisplayName,
  parseToolAction,
  type ToolActionView,
} from "@/components/chat/tool-actions";
import type { Message } from "./types";

export type ChatStreamEvent =
  | { event: "text"; text: string }
  | { event: "tool_use"; tool: string; input?: unknown }
  | { event: "tool_result"; tool: string; result?: unknown; summary?: string }
  | { event: "done"; conversationId: string; traceUrl?: string }
  | { event: "error"; code?: string; error?: string };

export interface StreamEventContext {
  assistantId: string;
  createToolMessageId?: () => string;
}

export function toRecord(value: unknown): Record<string, unknown> | undefined {
  if (!!value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

export function getStreamErrorMessage(code?: string, fallback?: string): string {
  switch (code) {
    case "provider_unavailable":
      return "El proveedor de IA no esta disponible. Intenta de nuevo en unos minutos.";
    case "tool_execution_failed":
      return "Hubo un error al ejecutar una accion. Tus datos no se vieron afectados.";
    case "conversation_not_found":
      return "No se encontro la conversacion. Inicia una nueva.";
    default:
      return fallback ? `Error: ${fallback}` : "Ocurrio un error inesperado.";
  }
}

function updateAssistantMessage(
  messages: Message[],
  assistantId: string,
  update: (message: Message) => Message,
): Message[] {
  return messages.map((message) =>
    message.id === assistantId ? update(message) : message,
  );
}

export function applyStreamEvent(
  messages: Message[],
  event: ChatStreamEvent,
  context: StreamEventContext,
): Message[] {
  const { assistantId, createToolMessageId } = context;

  switch (event.event) {
    case "text":
      return updateAssistantMessage(messages, assistantId, (message) => ({
        ...message,
        content: message.content + event.text,
      }));

    case "tool_use": {
      const action: ToolActionView = {
        title: getToolDisplayName(event.tool),
        detail: "Ejecutando accion...",
        tone: "info",
      };

      return [
        ...messages,
        {
          id: createToolMessageId ? createToolMessageId() : `tool-${Date.now()}`,
          role: "tool",
          content: action.detail || action.title,
          toolName: event.tool,
          action,
          pending: true,
          toolInput: toRecord(event.input),
        },
      ];
    }

    case "tool_result": {
      const toolIndex = messages.findLastIndex(
        (message) => message.role === "tool" && message.toolName === event.tool,
      );

      if (toolIndex < 0) return messages;

      const action = parseToolAction(
        event.tool,
        typeof event.result === "string" ? event.result : event.summary,
      );
      const updated = [...messages];
      updated[toolIndex] = {
        ...updated[toolIndex],
        action,
        pending: false,
        content: action.detail || action.title,
      };
      return updated;
    }

    case "done":
      if (!event.traceUrl) return messages;
      return updateAssistantMessage(messages, assistantId, (message) => ({
        ...message,
        traceUrl: event.traceUrl,
      }));

    case "error":
      return updateAssistantMessage(messages, assistantId, (message) => ({
        ...message,
        content: getStreamErrorMessage(event.code, event.error),
      }));

    default:
      return messages;
  }
}

export function markStreamInterrupted(
  messages: Message[],
  assistantId: string,
): Message[] {
  return messages.map((message) => {
    if (message.id === assistantId) {
      return { ...message, interrupted: true };
    }
    if (message.role === "tool" && message.pending) {
      return {
        ...message,
        pending: false,
        content: "Accion interrumpida",
        action: message.action
          ? { ...message.action, detail: "Accion interrumpida", tone: "warning" }
          : undefined,
      };
    }
    return message;
  });
}
