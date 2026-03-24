"use client";

import { useState } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { chatStream } from "@/lib/api/client";
import {
  getToolDisplayName,
  parseToolAction,
  type ToolActionView,
} from "@/lib/chat/tool-actions";
import { syncTaskQueryState } from "@/lib/tasks/chat-sync";
import type { Message } from "./types";

function getErrorMessage(code?: string, fallback?: string): string {
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

export function useChatStream(args: {
  queryClient: QueryClient;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setConversationId: (id: string | undefined) => void;
  loadConversationHistory: (id?: string) => Promise<void>;
}) {
  const { queryClient, setMessages, setConversationId, loadConversationHistory } = args;
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  async function handleSubmit(
    e: React.FormEvent,
    agentEndpoint: string,
    conversationId?: string,
  ) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    const assistantId = (Date.now() + 1).toString();
    const userInput = input.trim();

    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    let completedConversationId = conversationId;

    try {
      for await (const event of chatStream(agentEndpoint, userInput, conversationId)) {
        if (event.event === "text") {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, content: message.content + event.text }
                : message,
            ),
          );
        } else if (event.event === "tool_use") {
          const action: ToolActionView = {
            title: getToolDisplayName(event.tool),
            detail: "Ejecutando accion...",
            tone: "info",
          };

          setMessages((prev) => [
            ...prev,
            {
              id: `tool-${Date.now()}`,
              role: "tool",
              content: action.detail || action.title,
              toolName: event.tool,
              action,
              pending: true,
              toolInput:
                event.input && typeof event.input === "object"
                  ? (event.input as Record<string, unknown>)
                  : undefined,
            },
          ]);
        } else if (event.event === "tool_result") {
          let toolInput: Record<string, unknown> | undefined;

          setMessages((prev) => {
            const toolIndex = prev.findLastIndex(
              (message) =>
                message.role === "tool" && message.toolName === event.tool,
            );

            if (toolIndex < 0) return prev;

            const updated = [...prev];
            toolInput = updated[toolIndex].toolInput;
            const action = parseToolAction(
              event.tool,
              typeof event.result === "string" ? event.result : event.summary,
            );
            updated[toolIndex] = {
              ...updated[toolIndex],
              action,
              pending: false,
              content: action.detail || action.title,
            };
            return updated;
          });

          syncTaskQueryState({
            tool: event.tool,
            result: typeof event.result === "string" ? event.result : undefined,
            input: toolInput,
            queryClient,
          });
        } else if (event.event === "done") {
          completedConversationId = event.conversationId;
          setConversationId(event.conversationId);
          if (event.traceUrl) {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId
                  ? { ...message, traceUrl: event.traceUrl }
                  : message,
              ),
            );
          }
        } else if (event.event === "error") {
          const errorMessage = getErrorMessage(event.code, event.error);
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, content: errorMessage }
                : message,
            ),
          );
        }
      }

      if (completedConversationId) {
        await loadConversationHistory(completedConversationId);
      }
    } catch (error: any) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? { ...message, content: `Error: ${error.message}` }
            : message,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  return {
    input,
    setInput,
    isStreaming,
    handleSubmit,
  };
}
