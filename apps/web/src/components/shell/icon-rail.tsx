"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { domains, getDomainFromPathname, type DomainConfig } from "@/lib/navigation";

function DomainIcon({ domain, isActive }: { domain: DomainConfig; isActive: boolean }) {
  if (domain.disabled) {
    return (
      <div
        title={`${domain.label} — Proximamente`}
        className="w-10 h-10 rounded-xl flex items-center justify-center opacity-30 cursor-default group relative"
      >
        <span className="relative text-sm font-bold text-[var(--muted)]">
          {domain.iconLetter}
        </span>

        {/* Tooltip */}
        <div className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-[var(--background-secondary)] border border-[var(--glass-border)] text-xs font-medium text-[var(--muted)] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
          {domain.label}
          <span className="ml-1.5 text-[10px] opacity-70">Proximamente</span>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={domain.navItems[0].href}
      title={domain.label}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
        isActive
          ? "text-white"
          : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)]"
      }`}
    >
      {isActive && (
        <div
          className="absolute inset-0 rounded-xl opacity-90"
          style={{
            background: `linear-gradient(135deg, var(--accent), var(--accent-secondary))`,
            boxShadow: `0 2px 12px var(--accent-glow)`,
          }}
        />
      )}
      <span className="relative text-sm font-bold">
        {domain.iconLetter}
      </span>

      {/* Tooltip */}
      <div className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-[var(--background-secondary)] border border-[var(--glass-border)] text-xs font-medium text-[var(--foreground)] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
        {domain.label}
      </div>
    </Link>
  );
}

export function IconRail() {
  const pathname = usePathname();
  const activeDomain = getDomainFromPathname(pathname);

  return (
    <div className="w-16 flex flex-col items-center py-4 bg-[var(--icon-rail-bg)] border-r border-[var(--sidebar-border)]">
      {/* Home */}
      <Link
        href="/home"
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 transition-all cursor-pointer ${
          pathname === "/home"
            ? "bg-[var(--active-overlay)] text-[var(--foreground)]"
            : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)]"
        }`}
      >
        <Home size={18} strokeWidth={1.8} />
      </Link>

      {/* Domain icons */}
      <div className="flex flex-col gap-2 flex-1">
        {domains.map((domain) => (
          <DomainIcon
            key={domain.key}
            domain={domain}
            isActive={activeDomain === domain.key}
          />
        ))}
      </div>
    </div>
  );
}
