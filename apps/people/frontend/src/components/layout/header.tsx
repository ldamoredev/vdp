"use client";

import { Search } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 border-b border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-xl flex items-center justify-between px-8">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--muted)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />
          <span>Preview</span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm text-[var(--foreground-muted)] bg-white/[0.03] border border-[var(--glass-border)]">
        <Search size={14} />
        <span className="text-[var(--muted)]">Buscar contactos...</span>
        <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] border border-[var(--glass-border)] text-[var(--muted)]">
          Ctrl K
        </kbd>
      </div>
    </header>
  );
}
