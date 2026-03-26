"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { domains, getDomainFromPathname, type DomainConfig } from "@/lib/navigation";

function MobileTabItem({ domain, isActive }: { domain: DomainConfig; isActive: boolean }) {
  if (domain.disabled) {
    return (
      <div className="relative flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl opacity-30 cursor-default">
        <span className="relative text-sm font-bold text-[var(--muted)]">{domain.iconLetter}</span>
        <span className="relative text-[10px] font-medium text-[var(--muted)]">{domain.label}</span>
      </div>
    );
  }

  return (
    <Link
      href={domain.navItems[0].href}
      className={`relative flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl transition-all ${
        isActive
          ? "text-white"
          : "text-[var(--muted)]"
      }`}
    >
      {isActive && (
        <div
          className="absolute w-10 h-10 rounded-xl opacity-90"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
            boxShadow: "0 2px 12px var(--accent-glow)",
          }}
        />
      )}
      <span className="relative text-sm font-bold">{domain.iconLetter}</span>
      <span className="relative text-[10px] font-medium">{domain.label}</span>
    </Link>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const activeDomain = getDomainFromPathname(pathname);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
      <nav className="flex items-center justify-around h-16 bg-[var(--icon-rail-bg)] backdrop-blur-xl border-t border-[var(--sidebar-border)] safe-bottom">
        {/* Home */}
        <Link
          href="/home"
          className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl transition-all ${
            pathname === "/home" ? "text-[var(--foreground)]" : "text-[var(--muted)]" }`}
        >
          {pathname === "/home" && (
            <div
              className="absolute w-10 h-10 rounded-xl opacity-90"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
                boxShadow: "0 2px 12px var(--accent-glow)",
              }}
            />
          )}
          <Home size={20} strokeWidth={1.8} className="relative" />
          <span className="relative text-[10px] font-medium">Home</span>
        </Link>

        {/* Domain icons */}
        {domains.map((domain) => (
          <MobileTabItem
            key={domain.key}
            domain={domain}
            isActive={activeDomain === domain.key}
          />
        ))}
      </nav>
    </div>
  );
}
