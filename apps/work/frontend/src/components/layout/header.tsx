"use client";

export function Header() {
  return (
    <header className="h-16 border-b border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-xl flex items-center justify-between px-8">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--muted)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />
          <span>Preview</span>
        </div>
      </div>
      <div className="text-xs text-[var(--muted)]">Semana 11, 2026</div>
    </header>
  );
}
