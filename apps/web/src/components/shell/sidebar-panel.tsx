"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDomainFromPathname, getDomainConfig } from "@/lib/navigation";

export function SidebarPanel() {
  const pathname = usePathname();
  const domainKey = getDomainFromPathname(pathname);
  const domain = domainKey ? getDomainConfig(domainKey) : null;

  if (!domain) return null;

  return (
    <aside className="w-full md:w-52 h-full flex flex-col bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] backdrop-blur-xl">
      {/* Domain header */}
      <div className="p-5 border-b border-[var(--sidebar-border)]">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, var(--accent), var(--accent-secondary))` }}
          >
            <span className="text-white text-sm font-bold">{domain.iconLetter}</span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-[var(--foreground)]">{domain.label}</h1>
            <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-widest">
              {domain.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {domain.navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== `/${domain.key}` && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-[var(--accent)] text-white shadow-lg"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)]"
              }`}
              style={isActive ? { boxShadow: `0 4px 12px var(--accent-glow)` } : undefined}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-[var(--sidebar-border)]">
        <div className="glass-card-static p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
            <span className="text-xs font-medium text-[var(--foreground-muted)]">AI Activo</span>
          </div>
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            {domain.aiDescription}
          </p>
        </div>
      </div>
    </aside>
  );
}
