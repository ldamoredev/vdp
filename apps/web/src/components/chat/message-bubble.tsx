import { Loader2, Wrench } from "lucide-react";
import { getToolDisplayName } from "@/lib/chat/tool-actions";
import type { Message } from "./types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === "user") {
    return (
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
    );
  }

  if (message.role === "assistant") {
    return (
      <div className="flex gap-2">
        <div className="glass-card-static px-4 py-2.5 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed text-[var(--foreground)]">
          {message.content || (
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs">Pensando...</span>
            </div>
          )}
          {message.traceUrl && (
            <a
              href={message.traceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-1 text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Ver traza
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
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
  );
}
