import { Outlet, useLocation } from "react-router";
import { IconRail } from '@/ui/shell/icon-rail';
import { SidebarDrawer } from '@/ui/shell/sidebar-drawer';
import { Header } from '@/ui/shell/header';
import { ChatPanel } from '@/ui/shell/chat-panel';
import { AuthGate } from '@/ui/shell/auth-gate';
import { MobileTabBar } from '@/ui/shell/mobile-tab-bar';
import { InsightsProvider } from '@/ui/shell/insights-provider';
import { getDomainFromPathname } from '@/lib/navigation';
import React from 'react';

export default function DomainLayout() {
    const { pathname } = useLocation();
    const domainKey = getDomainFromPathname(pathname);

    return (
        <AuthGate>
            <div className={`flex h-screen relative z-10 ${domainKey ? `domain-${domainKey}` : ''}`}>
                <div className="hidden md:flex">
                    <IconRail/>
                </div>

                <SidebarDrawer/>

                <div className="flex flex-col flex-1 overflow-hidden">
                    <Header/>
                    <main className="relative flex-1 overflow-auto p-4 pb-20 md:p-8 md:pb-8"><Outlet /></main>
                </div>

                <ChatPanel/>

                <MobileTabBar />

                <InsightsProvider/>
            </div>
        </AuthGate>
    );
}
