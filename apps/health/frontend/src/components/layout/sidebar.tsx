"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Activity, CalendarClock, Pill, Repeat, Scale, ChevronLeft } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/metrics", label: "Metricas", icon: Activity },
  { href: "/habits", label: "Habitos", icon: Repeat },
  { href: "/medications", label: "Medicamentos", icon: Pill },
  { href: "/appointments", label: "Citas", icon: CalendarClock },
  { href: "/body", label: "Medidas", icon: Scale },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 flex flex-col bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] backdrop-blur-xl">
      <div className="p-5 border-b border-[var(--sidebar-border)]">
        <Link href="http://localhost:3000" className="flex items-center gap-2 text-[var(--muted)] text-xs font-medium hover:text-[var(--foreground)] transition-colors cursor-pointer group">
          <ChevronLeft size={14} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          <span>VDP</span>
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">H</span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">Health</h1>
            <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-widest">Bienestar</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${isActive ? "bg-[var(--accent)] text-white shadow-lg shadow-emerald-500/20" : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04]"}`}>
              <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              {item.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[var(--sidebar-border)]">
        <div className="glass-card-static p-3 rounded-xl">
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">Modulo de salud y bienestar</p>
        </div>
      </div>
    </aside>
  );
}
