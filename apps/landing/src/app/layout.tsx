import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VDP",
  description: "Tu sistema organizacional personal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
