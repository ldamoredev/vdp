import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ChatPanel } from "@/components/chat/chat-panel";

export const metadata: Metadata = {
  title: "VDP Health",
  description: "Controla tu salud y bienestar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <div className="flex h-screen relative z-10">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto p-8">{children}</main>
            </div>
            <ChatPanel />
          </div>
        </Providers>
      </body>
    </html>
  );
}
