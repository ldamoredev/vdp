import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, chatStream } from "@/lib/api/client";
import { emitTasksChangedForAgentTool } from "./tasks-chat-sync-bridge";
import {
  applyStreamEvent,
  getStreamErrorMessage,
  markStreamInterrupted,
  type ChatStreamEvent,
} from "./chat-stream-reducer";
import type { Message } from "./types";

export function useChatStream(args: {
  onTaskMutation?: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setConversationId: (id: string | undefined) => void;
  loadConversationHistory: (id?: string) => Promise<void>;
}) {
  const { onTaskMutation, setMessages, setConversationId, loadConversationHistory } = args;
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  useEffect(() => stop, [stop]);

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
    const controller = new AbortController();
    abortRef.current = controller;

    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setSendError(null);
    setIsStreaming(true);

    let doneConversationId: string | undefined;
    let receivedAnyEvent = false;
    let sawTerminalEvent = false;

    try {
      for await (const rawEvent of chatStream(agentEndpoint, userInput, conversationId, {
        signal: controller.signal,
      })) {
        const event = rawEvent as ChatStreamEvent;
        receivedAnyEvent = true;

        setMessages((prev) => applyStreamEvent(prev, event, { assistantId }));

        if (event.event === "tool_result") {
          emitTasksChangedForAgentTool(event.tool, () => {
            onTaskMutation?.();
          });
        } else if (event.event === "done") {
          doneConversationId = event.conversationId;
          sawTerminalEvent = true;
          setConversationId(event.conversationId);
        } else if (event.event === "error") {
          sawTerminalEvent = true;
        }
      }

      if (!sawTerminalEvent) {
        // El stream se corto sin evento done/error: marcar la respuesta como
        // interrumpida en vez de dejarla truncada en silencio.
        setMessages((prev) => markStreamInterrupted(prev, assistantId));
        return;
      }

      if (doneConversationId) {
        await loadConversationHistory(doneConversationId);
      }
    } catch (error: unknown) {
      if (controller.signal.aborted) {
        setMessages((prev) => markStreamInterrupted(prev, assistantId));
      } else if (!receivedAnyEvent) {
        // Fallo antes del primer evento: revertir los mensajes optimistas y
        // devolver el texto al input para que reintentar sea un solo click.
        setMessages((prev) =>
          prev.filter((message) => message.id !== userMsg.id && message.id !== assistantId),
        );
        setInput(userInput);
        setSendError(
          getStreamErrorMessage(
            error instanceof ApiError ? error.code : undefined,
            error instanceof Error ? error.message : undefined,
          ),
        );
      } else {
        setMessages((prev) =>
          applyStreamEvent(
            prev,
            {
              event: "error",
              error: error instanceof Error ? error.message : undefined,
            },
            { assistantId },
          ),
        );
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsStreaming(false);
    }
  }

  return {
    input,
    setInput,
    isStreaming,
    sendError,
    stop,
    handleSubmit,
  };
}
