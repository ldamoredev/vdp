"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-breakpoint";
import { useSidebarOpen } from "@/lib/use-shell-store";
import { shellStore } from "@/lib/shell-store";
import { SidebarPanel } from "./sidebar-panel";

export function SidebarDrawer() {
  const isMobile = useIsMobile();
  const isOpen = useSidebarOpen();
  const pathname = usePathname();

  // Auto-close drawer on navigation (mobile only)
  useEffect(() => {
    if (isMobile) {
      shellStore.close();
    }
  }, [pathname, isMobile]);

  // Desktop: render sidebar inline
  if (!isMobile) {
    return <SidebarPanel />;
  }

  // Mobile: render as overlay drawer
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-backdrop"
        onClick={shellStore.close}
      />
      {/* Drawer */}
      <div className="relative w-64 h-full animate-slide-in-left">
        <SidebarPanel />
      </div>
    </div>
  );
}
