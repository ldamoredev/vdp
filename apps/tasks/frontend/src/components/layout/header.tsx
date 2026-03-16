"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare } from "lucide-react";
import { chatStore } from "@/lib/chat-store";
import { useChatOpen } from "@/lib/use-chat-store";

export function Header() {
  const isChatOpen = useChatOpen();

  return (
    <header className="h-16 border-b border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-xl flex items-center justify-between px-8">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--muted)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />
          <span>Conectado</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-[var(--muted)]">
          {format(new Date(), "EEEE, d MMM yyyy", { locale: es })}
        </span>
        <button
          onClick={chatStore.toggle}
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            isChatOpen
              ? "bg-violet-500/15 text-violet-400"
              : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04]"
          }`}
        >
          <MessageSquare size={18} />
        </button>
      </div>
    </header>
  );
}
