import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Send, Square } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";
import { useIsMobile } from "@/lib/use-breakpoint";
import { domains, getDomainConfig, getDomainFromPathname, type DomainKey } from "@/lib/navigation";
import { useChatOpen } from "@/lib/chat-store";
import { agentChatDisabledMessage, useAgentChatStatus } from "@/lib/agent-chat-status";
import { useTasksEvents } from "@/TasksEventsProvider";
import { ChatHeader } from "@/components/chat/chat-header";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageBubble } from "@/components/chat/message-bubble";
import { useChatConversations } from "@/components/chat/use-chat-conversations";
import { useChatStream } from "@/components/chat/use-chat-stream";

function getAgentBasePath(endpoint: string) {
  return endpoint.replace(/\/chat$/, "");
}

const enabledDomains = domains.filter((d) => !d.disabled);

export function ChatPanel() {
  const isOpen = useChatOpen();
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const tasksEvents = useTasksEvents();
  const agentChat = useAgentChatStatus();
  // Outside a domain (home, review, settings) the chat stays available with a
  // user-selectable agent; inside a domain the route decides.
  const routeDomainKey = getDomainFromPathname(pathname);
  const [fallbackDomainKey, setFallbackDomainKey] = useState<DomainKey>("tasks");
  const domainKey = routeDomainKey ?? fallbackDomainKey;
  const domain = getDomainConfig(domainKey) ?? null;
  const agentBasePath = domain && agentChat.enabled ? getAgentBasePath(domain.agentEndpoint) : null;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chat = useChatConversations({ domainKey, agentBasePath });
  const stream = useChatStream({
    queryClient,
    onTaskMutation: () => void tasksEvents.emitTasksChanged(),
    setMessages: chat.setMessages,
    setConversationId: chat.setConversationId,
    loadConversationHistory: chat.loadConversationHistory,
  });

  // Si cambia el dominio a mitad de un stream, cortarlo: el estado de
  // mensajes se intercambia por el del dominio nuevo y el stream viejo
  // escribiria sobre la conversacion equivocada.
  const stopStream = stream.stop;
  useEffect(() => () => stopStream(), [domainKey, stopStream]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  function handleNewConversation() {
    chat.startNewConversation();
    inputRef.current?.focus();
  }

  if (!isOpen || !domain) return null;

  const disabledMessage = agentChatDisabledMessage(agentChat);

  return (
    <div
      className={
        isMobile
          ? "fixed inset-0 z-50 bg-[var(--sidebar)] backdrop-blur-xl flex flex-col animate-slide-in-up"
          : "w-96 border-l border-[var(--glass-border)] bg-[var(--sidebar)] backdrop-blur-xl flex flex-col h-full animate-slide-in-right"
      }
    >
      <ChatHeader
        label={domain.label}
        isMobile={isMobile}
        domainOptions={routeDomainKey ? undefined : enabledDomains}
        selectedDomain={domainKey}
        onSelectDomain={(key) => setFallbackDomainKey(key)}
      />

      {agentChat.enabled && (
        <ConversationList
          conversations={chat.conversations}
          conversationId={chat.conversationId}
          isLoadingHistory={chat.isLoadingHistory}
          historyError={chat.historyError}
          onNewConversation={handleNewConversation}
          onSelect={(id) => void chat.handleConversationSelect(id)}
        />
      )}

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {!agentChat.enabled && (
          <div className="text-center py-16 animate-fade-in">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent) 14%, transparent)",
              }}
            >
              <Bot size={22} className="text-[var(--accent)]" />
            </div>
            <p className="text-sm font-semibold tracking-tight mb-1.5 text-[var(--foreground)]">
              Chat IA no configurado
            </p>
            <p className="text-xs text-[var(--muted)] max-w-[240px] mx-auto leading-relaxed">
              {agentChat.isLoading ? "Verificando configuracion del servidor..." : disabledMessage}
            </p>
          </div>
        )}

        {agentChat.enabled && chat.conversationId && chat.messages.length > 0 && (() => {
          const activeConv = chat.conversations.find((c) => c.id === chat.conversationId);
          if (!activeConv) return null;
          return (
            <div className="flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2">
              <History size={12} className="shrink-0 text-[var(--muted)]" />
              <span className="text-[11px] text-[var(--muted)] truncate">
                Continuando conversacion
                {activeConv.title ? ` — ${activeConv.title}` : ""}
                {" · "}
                {formatDistanceToNow(new Date(activeConv.createdAt), { addSuffix: true })}
              </span>
            </div>
          );
        })()}

        {agentChat.enabled && chat.messages.length === 0 && !chat.isLoadingHistory && (
          <div className="text-center py-16 animate-fade-in">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{
                background:
                  "color-mix(in srgb, var(--accent) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)",
              }}
            >
              <Bot size={22} className="text-[var(--accent)]" />
            </div>
            <p className="text-sm font-semibold tracking-tight mb-1.5 text-[var(--foreground)]">
              {domain.chatWelcome}
            </p>
            <p className="text-xs text-[var(--muted)] max-w-[220px] mx-auto leading-relaxed">
              {domain.chatDescription}
            </p>
          </div>
        )}

        {agentChat.enabled && chat.messages.map((message) => (
          <div key={message.id}>
            <MessageBubble message={message} />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={(e) => stream.handleSubmit(e, domain.agentEndpoint, chat.conversationId)}
        className="p-3 border-t border-[var(--glass-border)]"
      >
        {stream.sendError && (
          <p className="px-1 pb-2 text-xs text-[var(--red-soft-text)]">
            {stream.sendError}
          </p>
        )}
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            value={stream.input}
            onChange={(e) => stream.setInput(e.target.value)}
            placeholder={agentChat.enabled ? domain.chatPlaceholder : "Chat IA desactivado"}
            className="glass-input flex-1 px-3.5 py-2.5 text-[13px]"
            disabled={!agentChat.enabled || stream.isStreaming}
          />
          {stream.isStreaming ? (
            <button
              type="button"
              onClick={stream.stop}
              aria-label="Detener respuesta"
              className="btn-primary p-2.5"
            >
              <Square size={15} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!agentChat.enabled || !stream.input.trim()}
              className="btn-primary p-2.5 disabled:opacity-30"
            >
              <Send size={15} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
