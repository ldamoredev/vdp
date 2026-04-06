"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings2 } from "lucide-react";
import {
  getDomainFromPathname,
  getDomainConfig,
  isSettingsPath,
  settingsNavItem,
} from "@/lib/navigation";

export function SidebarPanel() {
  const pathname = usePathname();
  const domainKey = getDomainFromPathname(pathname);
  const domain = domainKey ? getDomainConfig(domainKey) : null;
  const settingsRoute = isSettingsPath(pathname);

  if (!domain && !settingsRoute) return null;

  if (!domain && settingsRoute) {
    return (
      <aside className="w-full md:w-48 h-full flex flex-col bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] backdrop-blur-xl">
        <div className="px-4 py-3.5 border-b border-[var(--sidebar-border)]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))" }}
            >
              <Settings2 size={16} strokeWidth={2} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold tracking-tight text-[var(--foreground)] leading-tight">
                Configuracion
              </h1>
              <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-widest truncate">
                Cuenta y acceso
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2.5 space-y-0.5">
          <Link
            href={settingsNavItem.href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer bg-[var(--accent)] text-white"
            style={{ boxShadow: "0 2px 10px var(--accent-glow)" }}
          >
            <settingsNavItem.icon size={16} strokeWidth={2.2} />
            {settingsNavItem.label}
          </Link>
        </nav>

        <div className="p-3 border-t border-[var(--sidebar-border)]">
          <div className="rounded-xl bg-[var(--hover-overlay)] border border-[var(--glass-border)] p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />
              <span className="text-[11px] font-medium text-[var(--foreground-muted)]">
                Zona segura
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              Ajusta identidad, contrasena y sesion desde un unico panel.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  if (!domain) return null;

  return (
    <aside className="w-full md:w-48 h-full flex flex-col bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] backdrop-blur-xl">
      {/* Domain header */}
      <div className="px-4 py-3.5 border-b border-[var(--sidebar-border)]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, var(--accent), var(--accent-secondary))` }}
          >
            <span className="text-white text-sm font-bold">{domain.iconLetter}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-[var(--foreground)] leading-tight">{domain.label}</h1>
            <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-widest truncate">
              {domain.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2.5 space-y-0.5">
        {domain.navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== `/${domain.key}` && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)]"
              }`}
              style={isActive ? { boxShadow: `0 2px 10px var(--accent-glow)` } : undefined}
            >
              <item.icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* AI status */}
      <div className="p-3 border-t border-[var(--sidebar-border)]">
        <div className="rounded-xl bg-[var(--hover-overlay)] border border-[var(--glass-border)] p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse" />
            <span className="text-[11px] font-medium text-[var(--foreground-muted)]">AI Activo</span>
          </div>
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            {domain.aiDescription}
          </p>
        </div>
      </div>
    </aside>
  );
}
