"use client";

import { usePathname } from "next/navigation";
import { IconRail } from "@/components/shell/icon-rail";
import { SidebarPanel } from "@/components/shell/sidebar-panel";
import { Header } from "@/components/shell/header";
import { ChatPanel } from "@/components/shell/chat-panel";
import { getDomainFromPathname } from "@/lib/navigation";

export default function DomainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const domainKey = getDomainFromPathname(pathname);

  return (
    <div className={`flex h-screen relative z-10 ${domainKey ? `domain-${domainKey}` : ""}`}>
      <IconRail />
      <SidebarPanel />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
      <ChatPanel />
    </div>
  );
}
