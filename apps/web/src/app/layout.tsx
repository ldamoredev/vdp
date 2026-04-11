import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { ThemeProvider } from "@/lib/theme";

const APP_THEME_COLOR = "#020617";

export const metadata: Metadata = {
  title: "VDP — Life Operating System",
  description: "Tu vida, organizada en modulos inteligentes con IA",
  applicationName: "VDP",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VDP",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: APP_THEME_COLOR,
};

// Inline script to prevent flash of wrong theme on load
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme-preference');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
