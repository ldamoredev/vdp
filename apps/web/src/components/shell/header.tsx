"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, MessageCircle, Settings2, Sparkles } from "lucide-react";
import { chatStore } from "@/lib/chat-store";
import { logout, useCurrentUser } from "@/lib/auth";
import { shellStore } from "@/lib/shell-store";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Wire Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        chatStore.toggle();
      }

      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const isMac = typeof navigator !== "undefined" && navigator.platform?.includes("Mac");

  async function handleLogout() {
    await logout();
    await queryClient.invalidateQueries({ queryKey: ["auth"] });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="app-shell-header relative z-[70] isolate flex h-14 items-center justify-between border-b border-[var(--glass-border)] bg-[var(--glass)] px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={shellStore.toggle}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)] transition-all cursor-pointer"
        >
          <Menu size={18} strokeWidth={1.8} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        {currentUser && (
          <div ref={menuRef} className="relative z-[80]">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="header-shell-control header-user-chip flex items-center gap-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1.5 transition-all hover:bg-[var(--hover-overlay-strong)]"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center text-white text-xs font-bold">
                {currentUser.displayName?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="hidden min-w-0 text-left lg:block">
                <div className="text-sm font-medium leading-tight text-[var(--foreground)]">
                  {currentUser.displayName}
                </div>
                <div className="max-w-36 truncate text-[11px] text-[var(--muted)]">
                  {currentUser.email}
                </div>
              </div>
              <ChevronDown
                size={14}
                strokeWidth={1.9}
                className={`text-[var(--muted)] transition-transform ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[90] w-72 overflow-hidden rounded-[26px] border border-[var(--floating-panel-border)] bg-[var(--floating-panel)] p-2.5 shadow-[0_26px_70px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
                <div className="pointer-events-none absolute inset-0 rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.02))] opacity-70" />
                <div className="relative rounded-[22px] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--card)_94%,transparent)] px-3.5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                  <div className="text-sm font-semibold text-[var(--foreground)]">
                    {currentUser.displayName}
                  </div>
                  <div className="mt-1 truncate text-xs text-[var(--foreground-muted)]">
                    {currentUser.email}
                  </div>
                </div>

                <div className="relative mt-2 space-y-1 rounded-[22px] bg-[color-mix(in_srgb,var(--background-secondary)_90%,transparent)] p-1.5">
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--hover-overlay-strong)]"
                  >
                    <Settings2 size={15} strokeWidth={1.8} className="text-[var(--accent)]" />
                    Configuracion de cuenta
                  </Link>
                  <button
                    onClick={async () => {
                      setMenuOpen(false);
                      await handleLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--hover-overlay-strong)]"
                  >
                    <LogOut size={15} strokeWidth={1.8} className="text-[var(--accent-red)]" />
                    Cerrar sesion
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="header-shell-toggle">
          <ThemeToggle />
        </div>
        <button
          onClick={chatStore.toggle}
          className="header-shell-control flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3.5 py-1.5 text-sm font-medium text-[var(--foreground-muted)] transition-all cursor-pointer group hover:border-[var(--glass-border-hover)] hover:bg-[var(--hover-overlay-strong)] hover:text-[var(--foreground)]"
        >
          <div className="relative">
            <MessageCircle size={15} strokeWidth={1.8} />
            <Sparkles size={7} className="absolute -top-1 -right-1 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="hidden md:inline text-[13px]">Chat IA</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--hover-overlay)] border border-[var(--glass-border)] text-[var(--muted)]">
            {isMac ? "⌘" : "Ctrl"}K
          </kbd>
        </button>
      </div>
    </header>
  );
}
