"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  TrendingUp,
  BarChart3,
  ChevronLeft,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transacciones", icon: ArrowLeftRight },
  { href: "/savings", label: "Ahorros", icon: PiggyBank },
  { href: "/investments", label: "Inversiones", icon: TrendingUp },
  { href: "/stats", label: "Estadisticas", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex flex-col bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] backdrop-blur-xl">
      {/* Logo area */}
      <div className="p-5 border-b border-[var(--sidebar-border)]">
        <Link
          href="http://localhost:3000"
          className="flex items-center gap-2 text-[var(--muted)] text-xs font-medium hover:text-[var(--foreground)] transition-colors cursor-pointer group"
        >
          <ChevronLeft size={14} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          <span>VDP</span>
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">W</span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">Wallet</h1>
            <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-widest">Finanzas</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-[var(--accent)] text-white shadow-lg shadow-blue-500/20"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04]"
              }`}
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
            Usa el chat para gestionar tus finanzas con IA
          </p>
        </div>
      </div>
    </aside>
  );
}
