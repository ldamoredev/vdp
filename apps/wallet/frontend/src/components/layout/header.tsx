"use client";

import { MessageCircle, Sparkles } from "lucide-react";
import { chatStore } from "@/lib/chat-store";

export function Header() {
  return (
    <header className="h-16 border-b border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-xl flex items-center justify-between px-8">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--muted)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />
          <span>Conectado</span>
        </div>
      </div>
      <button
        onClick={chatStore.toggle}
        className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-white/[0.03] hover:bg-white/[0.06] border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] transition-all cursor-pointer group"
      >
        <div className="relative">
          <MessageCircle size={16} strokeWidth={1.8} />
          <Sparkles size={8} className="absolute -top-1 -right-1 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <span>Chat IA</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] border border-[var(--glass-border)] text-[var(--muted)]">
          Ctrl K
        </kbd>
      </button>
    </header>
  );
}
