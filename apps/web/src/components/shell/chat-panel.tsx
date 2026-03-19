"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useChatOpen } from "@/lib/use-chat-store";
import { chatStore } from "@/lib/chat-store";
import { chatStream } from "@/lib/api/client";
import { getDomainFromPathname, getDomainConfig } from "@/lib/navigation";
import { X, Send, Bot, Wrench, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-breakpoint";

interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
}

// Per-domain conversation state
const domainConversations = new Map<string, { messages: Message[]; conversationId?: string }>();

export function ChatPanel() {
  const isOpen = useChatOpen();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const domainKey = getDomainFromPathname(pathname);
  const domain = domainKey ? getDomainConfig(domainKey) : null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevDomainRef = useRef<string | null>(null);

  // Switch conversation context when domain changes
  useEffect(() => {
    if (domainKey !== prevDomainRef.current) {
      // Save current state
      if (prevDomainRef.current) {
        domainConversations.set(prevDomainRef.current, {
          messages,
          conversationId,
        });
      }
      // Restore or initialize
      const saved = domainKey ? domainConversations.get(domainKey) : undefined;
      setMessages(saved?.messages || []);
      setConversationId(saved?.conversationId);
      prevDomainRef.current = domainKey;
    }
  }, [domainKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming || !domain) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      for await (const event of chatStream(
        domain.agentEndpoint,
        userMsg.content,
        conversationId
      )) {
        if (event.event === "text") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + event.text }
                : m
            )
          );
        } else if (event.event === "tool_use") {
          setMessages((prev) => [
            ...prev,
            {
              id: `tool-${Date.now()}`,
              role: "tool",
              content: `Usando: ${event.tool}`,
              toolName: event.tool,
            },
          ]);
        } else if (event.event === "tool_result") {
          setMessages((prev) => {
            const toolIdx = prev.findLastIndex(
              (m) => m.role === "tool" && m.toolName === event.tool
            );
            if (toolIdx >= 0) {
              const updated = [...prev];
              updated[toolIdx] = {
                ...updated[toolIdx],
                content: `${event.tool}: ${event.summary}`,
              };
              return updated;
            }
            return prev;
          });
        } else if (event.event === "done") {
          setConversationId(event.conversationId);
          queryClient.invalidateQueries();
        } else if (event.event === "error") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `Error: ${event.error}` }
                : m
            )
          );
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Error: ${err.message}` }
            : m
        )
      );
    }

    setIsStreaming(false);
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
      {/* Header */}
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
            style={{ background: `linear-gradient(135deg, var(--accent), var(--accent-secondary))` }}
          >
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <span className="font-medium text-sm text-[var(--foreground)]">Asistente {domain.label}</span>
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

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: `color-mix(in srgb, var(--accent) 15%, transparent)` }}
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
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" && (
              <div className="flex justify-end">
                <div
                  className="text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm max-w-[80%] shadow-lg"
                  style={{
                    background: `var(--accent)`,
                    boxShadow: `0 2px 8px var(--accent-glow)`,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            )}
            {msg.role === "assistant" && (
              <div className="flex gap-2">
                <div className="glass-card-static px-4 py-2.5 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed text-[var(--foreground)]">
                  {msg.content || (
                    <div className="flex items-center gap-2 text-[var(--muted)]">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-xs">Pensando...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {msg.role === "tool" && (
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "var(--amber-soft-bg)" }}>
                  <Wrench size={10} style={{ color: "var(--amber-soft-text)" }} />
                </div>
                <span className="text-xs text-[var(--muted)]">
                  {msg.content}
                </span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
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
              background: `linear-gradient(135deg, var(--accent), var(--accent-secondary))`,
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
