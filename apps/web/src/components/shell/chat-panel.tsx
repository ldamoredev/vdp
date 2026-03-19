"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bot,
  History,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { getAgentConversationMessages, listAgentConversations } from "@/lib/api/agent";
import { chatStream } from "@/lib/api/client";
import type {
  AgentConversation,
  AgentMessageRecord,
} from "@/lib/api/types";
import { chatStore } from "@/lib/chat-store";
import {
  getToolDisplayName,
  parseToolAction,
  type ToolActionView,
} from "@/lib/chat/tool-actions";
import { syncTaskQueryState } from "@/lib/tasks/chat-sync";
import { useIsMobile } from "@/hooks/use-breakpoint";
import { getDomainConfig, getDomainFromPathname } from "@/lib/navigation";
import { useChatOpen } from "@/lib/use-chat-store";

interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  action?: ToolActionView;
  pending?: boolean;
  toolInput?: Record<string, unknown>;
}

const domainConversations = new Map<
  string,
  { messages: Message[]; conversationId?: string }
>();

function getAgentBasePath(endpoint: string) {
  return endpoint.replace(/\/chat$/, "");
}

function mapPersistedMessages(records: AgentMessageRecord[]): Message[] {
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

export function ChatPanel() {
  const isOpen = useChatOpen();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const domainKey = getDomainFromPathname(pathname);
  const domain = domainKey ? getDomainConfig(domainKey) : null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevDomainRef = useRef<string | null>(null);
  const loadRequestRef = useRef(0);

  const agentBasePath = domain ? getAgentBasePath(domain.agentEndpoint) : null;

  useEffect(() => {
    if (domainKey) {
      domainConversations.set(domainKey, { messages, conversationId });
    }
  }, [conversationId, domainKey, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateConversationState() {
      if (domainKey === prevDomainRef.current) return;

      if (prevDomainRef.current) {
        domainConversations.set(prevDomainRef.current, {
          messages,
          conversationId,
        });
      }

      const saved = domainKey ? domainConversations.get(domainKey) : undefined;
      setMessages(saved?.messages || []);
      setConversationId(saved?.conversationId);
      setConversations([]);
      setHistoryError(null);
      prevDomainRef.current = domainKey;

      if (!domainKey || !agentBasePath) return;

      const requestId = ++loadRequestRef.current;
      setIsLoadingHistory(true);

      try {
        const recentConversations = await listAgentConversations(agentBasePath);
        if (cancelled || requestId !== loadRequestRef.current) return;

        setConversations(recentConversations);

        const targetConversationId =
          saved?.conversationId || recentConversations[0]?.id;

        if (!targetConversationId) {
          setMessages([]);
          setConversationId(undefined);
          return;
        }

        if (saved?.conversationId && saved.messages.length > 0) {
          return;
        }

        const history = await getAgentConversationMessages(
          agentBasePath,
          targetConversationId,
        );
        if (cancelled || requestId !== loadRequestRef.current) return;

        setConversationId(targetConversationId);
        setMessages(mapPersistedMessages(history));
      } catch (error: any) {
        if (!cancelled) {
          setHistoryError(error.message || "No se pudo cargar el historial");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    }

    void hydrateConversationState();

    return () => {
      cancelled = true;
    };
  }, [agentBasePath, conversationId, domainKey, messages]);

  async function loadConversationHistory(targetConversationId?: string) {
    if (!agentBasePath) return;

    const requestId = ++loadRequestRef.current;
    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const recentConversations = await listAgentConversations(agentBasePath);
      if (requestId !== loadRequestRef.current) return;

      setConversations(recentConversations);

      const nextConversationId =
        targetConversationId || recentConversations[0]?.id;

      if (!nextConversationId) {
        setConversationId(undefined);
        setMessages([]);
        return;
      }

      const history = await getAgentConversationMessages(
        agentBasePath,
        nextConversationId,
      );
      if (requestId !== loadRequestRef.current) return;

      setConversationId(nextConversationId);
      setMessages(mapPersistedMessages(history));
    } catch (error: any) {
      setHistoryError(error.message || "No se pudo cargar el historial");
    } finally {
      setIsLoadingHistory(false);
    }
  }

  function startNewConversation() {
    setConversationId(undefined);
    setMessages([]);
    setHistoryError(null);
    inputRef.current?.focus();
  }

  async function handleConversationSelect(targetConversationId: string) {
    if (targetConversationId === conversationId || !agentBasePath) return;
    await loadConversationHistory(targetConversationId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming || !domain || !agentBasePath) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    const assistantId = (Date.now() + 1).toString();
    const userInput = input.trim();

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setIsStreaming(true);

    let completedConversationId = conversationId;

    try {
      for await (const event of chatStream(
        domain.agentEndpoint,
        userInput,
        conversationId,
      )) {
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
        } else if (event.event === "error") {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, content: `Error: ${event.error}` }
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

  if (!isOpen || !domain) return null;

  return (
    <div
      className={
        isMobile
          ? "fixed inset-0 z-50 bg-[var(--sidebar)] backdrop-blur-xl flex flex-col animate-slide-in-up"
          : "w-96 border-l border-[var(--glass-border)] bg-[var(--sidebar)] backdrop-blur-xl flex flex-col h-full animate-slide-in-right"
      }
    >
      <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={chatStore.close}
              className="p-2 -ml-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)] transition-all cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
            }}
          >
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <span className="font-medium text-sm text-[var(--foreground)]">
              Asistente {domain.label}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse" />
              <span className="text-[10px] text-[var(--muted)]">En linea</span>
            </div>
          </div>
        </div>
        {!isMobile && (
          <button
            onClick={chatStore.close}
            className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)] transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="border-b border-[var(--glass-border)] p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--foreground)]">
            <History size={14} />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
              Historial
            </span>
          </div>
          <button
            type="button"
            onClick={startNewConversation}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] bg-[var(--hover-overlay)] hover:bg-[var(--soft-overlay)] transition-all cursor-pointer"
          >
            <Plus size={12} />
            Nueva
          </button>
        </div>

        {historyError && (
          <p className="text-xs text-[var(--amber-soft-text)]">{historyError}</p>
        )}

        {isLoadingHistory && conversations.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <Loader2 size={12} className="animate-spin" />
            <span>Cargando conversaciones...</span>
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-1.5 max-h-40 overflow-auto pr-1">
            {conversations.map((conversation) => {
              const isActive = conversation.id === conversationId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => void handleConversationSelect(conversation.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition-all cursor-pointer ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--hover-overlay)]"
                      : "border-transparent bg-transparent hover:bg-[var(--hover-overlay)]"
                  }`}
                >
                  <div className="text-sm font-medium text-[var(--foreground)] truncate">
                    {conversation.title || "Conversacion sin titulo"}
                  </div>
                  <div className="text-[11px] text-[var(--muted)] mt-1">
                    {formatDistanceToNow(new Date(conversation.updatedAt), {
                      addSuffix: true,
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            Aun no hay conversaciones guardadas para este dominio.
          </p>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && !isLoadingHistory && (
          <div className="text-center py-12">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background:
                  "color-mix(in srgb, var(--accent) 15%, transparent)",
              }}
            >
              <Bot size={24} className="text-[var(--accent)]" />
            </div>
            <p className="text-sm font-medium mb-1 text-[var(--foreground)]">
              {domain.chatWelcome}
            </p>
            <p className="text-xs text-[var(--muted)] max-w-[250px] mx-auto leading-relaxed">
              {domain.chatDescription}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id}>
            {message.role === "user" && (
              <div className="flex justify-end">
                <div
                  className="text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm max-w-[80%] shadow-lg"
                  style={{
                    background: "var(--accent)",
                    boxShadow: "0 2px 8px var(--accent-glow)",
                  }}
                >
                  {message.content}
                </div>
              </div>
            )}

            {message.role === "assistant" && (
              <div className="flex gap-2">
                <div className="glass-card-static px-4 py-2.5 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed text-[var(--foreground)]">
                  {message.content || (
                    <div className="flex items-center gap-2 text-[var(--muted)]">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-xs">Pensando...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {message.role === "tool" && (
              <div className="pl-2">
                <div
                  className="rounded-2xl border px-3 py-3 max-w-[88%]"
                  style={{
                    background:
                      message.action?.tone === "error"
                        ? "color-mix(in srgb, var(--red-soft-bg) 70%, transparent)"
                        : message.action?.tone === "success"
                          ? "color-mix(in srgb, var(--accent-green) 12%, transparent)"
                          : message.action?.tone === "warning"
                            ? "color-mix(in srgb, var(--amber-soft-bg) 70%, transparent)"
                            : "color-mix(in srgb, var(--accent) 10%, transparent)",
                    borderColor:
                      message.action?.tone === "error"
                        ? "color-mix(in srgb, var(--red-soft-text) 35%, transparent)"
                        : message.action?.tone === "success"
                          ? "color-mix(in srgb, var(--accent-green) 35%, transparent)"
                          : message.action?.tone === "warning"
                            ? "color-mix(in srgb, var(--amber-soft-text) 35%, transparent)"
                            : "color-mix(in srgb, var(--accent) 25%, transparent)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center mt-0.5"
                      style={{ background: "var(--hover-overlay)" }}
                    >
                      {message.pending ? (
                        <Loader2
                          size={11}
                          className="animate-spin text-[var(--muted)]"
                        />
                      ) : (
                        <Wrench size={11} className="text-[var(--foreground)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[var(--foreground)]">
                        {message.action?.title ||
                          getToolDisplayName(message.toolName || "herramienta")}
                      </div>
                      {message.content && (
                        <div className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                          {message.content}
                        </div>
                      )}
                      {message.action?.items && message.action.items.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.action.items.map((item) => (
                            <div
                              key={`${message.id}-${item}`}
                              className="text-xs text-[var(--foreground)] bg-[var(--hover-overlay)] rounded-lg px-2 py-1"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-[var(--glass-border)]"
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={domain.chatPlaceholder}
            className="glass-input flex-1 px-4 py-2.5 text-sm"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="p-2.5 text-white rounded-xl disabled:opacity-30 hover:shadow-lg transition-all cursor-pointer"
            style={{
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
