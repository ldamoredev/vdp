"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { domains, getDomainFromPathname, type DomainConfig } from "@/lib/navigation";

const enabledDomains = domains.filter((d) => !d.disabled);

function MobileTabItem({ domain, isActive }: { domain: DomainConfig; isActive: boolean }) {
  return (
    <Link
      href={domain.navItems[0].href}
      className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-12 rounded-xl transition-all ${
        isActive
          ? "text-white"
          : "text-[var(--muted)] active:scale-95"
      }`}
    >
      {isActive && (
        <div
          className="absolute w-10 h-10 rounded-xl"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
            boxShadow: "0 2px 12px var(--accent-glow)",
          }}
        />
      )}
      <span className="relative text-sm font-bold">{domain.iconLetter}</span>
      <span className="relative text-[9px] font-medium leading-none">{domain.label}</span>
    </Link>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const activeDomain = getDomainFromPathname(pathname);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
      <nav className="flex items-center justify-around h-14 bg-[var(--icon-rail-bg)] backdrop-blur-xl border-t border-[var(--sidebar-border)] safe-bottom px-2">
        {/* Home */}
        <Link
          href="/home"
          className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-12 rounded-xl transition-all ${
            pathname === "/home" ? "text-[var(--foreground)]" : "text-[var(--muted)] active:scale-95"
          }`}
        >
          {pathname === "/home" && (
            <div
              className="absolute w-10 h-10 rounded-xl"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
                boxShadow: "0 2px 12px var(--accent-glow)",
              }}
            />
          )}
          <Home size={18} strokeWidth={1.8} className="relative" />
          <span className="relative text-[9px] font-medium leading-none">Home</span>
        </Link>

        {/* Only enabled domain icons */}
        {enabledDomains.map((domain) => (
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
