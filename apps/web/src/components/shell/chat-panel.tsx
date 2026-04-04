"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";
import { useIsMobile } from "@/hooks/use-breakpoint";
import { getDomainConfig, getDomainFromPathname } from "@/lib/navigation";
import { useChatOpen } from "@/lib/use-chat-store";
import { ChatHeader } from "@/components/chat/chat-header";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageBubble } from "@/components/chat/message-bubble";
import { useChatConversations } from "@/components/chat/use-chat-conversations";
import { useChatStream } from "@/components/chat/use-chat-stream";

function getAgentBasePath(endpoint: string) {
  return endpoint.replace(/\/chat$/, "");
}

export function ChatPanel() {
  const isOpen = useChatOpen();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const domainKey = getDomainFromPathname(pathname);
  const domain = domainKey ? getDomainConfig(domainKey) : null;
  const agentBasePath = domain ? getAgentBasePath(domain.agentEndpoint) : null;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chat = useChatConversations({ domainKey, agentBasePath });
  const stream = useChatStream({
    queryClient,
    setMessages: chat.setMessages,
    setConversationId: chat.setConversationId,
    loadConversationHistory: chat.loadConversationHistory,
  });

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

  return (
    <div
      className={
        isMobile
          ? "fixed inset-0 z-50 bg-[var(--sidebar)] backdrop-blur-xl flex flex-col animate-slide-in-up"
          : "w-96 border-l border-[var(--glass-border)] bg-[var(--sidebar)] backdrop-blur-xl flex flex-col h-full animate-slide-in-right"
      }
    >
      <ChatHeader label={domain.label} isMobile={isMobile} />

      <ConversationList
        conversations={chat.conversations}
        conversationId={chat.conversationId}
        isLoadingHistory={chat.isLoadingHistory}
        historyError={chat.historyError}
        onNewConversation={handleNewConversation}
        onSelect={(id) => void chat.handleConversationSelect(id)}
      />

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {chat.conversationId && chat.messages.length > 0 && (() => {
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

        {chat.messages.length === 0 && !chat.isLoadingHistory && (
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

        {chat.messages.map((message) => (
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
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            value={stream.input}
            onChange={(e) => stream.setInput(e.target.value)}
            placeholder={domain.chatPlaceholder}
            className="glass-input flex-1 px-3.5 py-2.5 text-[13px]"
            disabled={stream.isStreaming}
          />
          <button
            type="submit"
            disabled={stream.isStreaming || !stream.input.trim()}
            className="btn-primary p-2.5 disabled:opacity-30"
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
