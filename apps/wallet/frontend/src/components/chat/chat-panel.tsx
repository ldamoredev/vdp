"use client";

import { useState, useRef, useEffect } from "react";
import { useChatOpen } from "@/lib/use-chat-store";
import { chatStore } from "@/lib/chat-store";
import { api } from "@/lib/api";
import { X, Send, Bot, Wrench, Loader2, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
}

export function ChatPanel() {
  const isOpen = useChatOpen();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

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
      for await (const event of api.chatStream(
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

  if (!isOpen) return null;

  return (
    <div className="w-96 border-l border-[var(--glass-border)] bg-[var(--sidebar)] backdrop-blur-xl flex flex-col h-full animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <span className="font-medium text-sm">Asistente IA</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse" />
              <span className="text-[10px] text-[var(--muted)]">En linea</span>
            </div>
          </div>
        </div>
        <button
          onClick={chatStore.close}
          className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04] transition-all cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4">
              <Bot size={24} className="text-[var(--accent)]" />
            </div>
            <p className="text-sm font-medium mb-1">
              Hola! Soy tu asistente financiero
            </p>
            <p className="text-xs text-[var(--muted)] max-w-[250px] mx-auto leading-relaxed">
              Podes pedirme que registre gastos, consultar saldos, ver
              estadisticas y mas
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" && (
              <div className="flex justify-end">
                <div className="bg-[var(--accent)] text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm max-w-[80%] shadow-lg shadow-blue-500/10">
                  {msg.content}
                </div>
              </div>
            )}
            {msg.role === "assistant" && (
              <div className="flex gap-2">
                <div className="glass-card-static px-4 py-2.5 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed">
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
                <div className="w-5 h-5 rounded-md bg-[var(--accent-amber)]/15 flex items-center justify-center">
                  <Wrench size={10} className="text-[var(--accent-amber)]" />
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
            placeholder="Registra un gasto de 5000 en comida..."
            className="glass-input flex-1 px-4 py-2.5 text-sm"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl disabled:opacity-30 hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
