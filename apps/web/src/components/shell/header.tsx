"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Menu, MessageCircle, Sparkles } from "lucide-react";
import { chatStore } from "@/lib/chat-store";
import { logout, useCurrentUser } from "@/lib/auth";
import { shellStore } from "@/lib/shell-store";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  // Wire Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        chatStore.toggle();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isMac = typeof navigator !== "undefined" && navigator.platform?.includes("Mac");

  async function handleLogout() {
    await logout();
    await queryClient.invalidateQueries({ queryKey: ["auth"] });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="h-16 border-b border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-xl flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={shellStore.toggle}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)] transition-all cursor-pointer"
        >
          <Menu size={18} strokeWidth={1.8} />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--muted)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />
          <span>Conectado</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {currentUser && (
          <div className="hidden lg:flex items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--foreground)]">
                {currentUser.displayName}
              </div>
              <div className="max-w-48 truncate text-xs text-[var(--foreground-muted)]">
                {currentUser.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
            >
              Salir
            </button>
          </div>
        )}
        <ThemeToggle />
        <button
          onClick={chatStore.toggle}
          className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-[var(--hover-overlay)] hover:bg-[var(--hover-overlay-strong)] border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] transition-all cursor-pointer group"
        >
          <div className="relative">
            <MessageCircle size={16} strokeWidth={1.8} />
            <Sparkles size={8} className="absolute -top-1 -right-1 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="hidden md:inline">Chat IA</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--hover-overlay)] border border-[var(--glass-border)] text-[var(--muted)]">
            {isMac ? "⌘" : "Ctrl"} K
          </kbd>
        </button>
      </div>
    </header>
  );
}
