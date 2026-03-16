"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-[var(--hover-overlay)] hover:bg-[var(--hover-overlay-strong)] border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] transition-all cursor-pointer"
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
    >
      {theme === "dark" ? (
        <Sun size={16} strokeWidth={1.8} className="animate-theme-icon" key="sun" />
      ) : (
        <Moon size={16} strokeWidth={1.8} className="animate-theme-icon" key="moon" />
      )}
    </button>
  );
}
