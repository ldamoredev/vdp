'use client';

import { usePathname } from 'next/navigation';
import { IconRail } from '@/components/shell/icon-rail';
import { SidebarDrawer } from '@/components/shell/sidebar-drawer';
import { Header } from '@/components/shell/header';
import { ChatPanel } from '@/components/shell/chat-panel';
import { MobileTabBar } from '@/components/shell/mobile-tab-bar';
import { InsightsProvider } from '@/components/shell/insights-provider';
import { getDomainFromPathname } from '@/lib/navigation';
import React from 'react';

export default function DomainLayout({ children }: { children: React.ReactNode; }) {
    const pathname = usePathname();
    const domainKey = getDomainFromPathname(pathname);

    return (
        <div className={`flex h-screen relative z-10 ${domainKey ? `domain-${domainKey}` : ''}`}>
            <div className="hidden md:flex">
                <IconRail/>
            </div>

            <SidebarDrawer/>

            <div className="flex flex-col flex-1 overflow-hidden">
                <Header/>
                <main className="flex-1 overflow-auto p-4 pb-20 md:p-8 md:pb-8">{children}</main>
            </div>

            <ChatPanel/>

            <MobileTabBar />

            <InsightsProvider/>
        </div>
    );
}
