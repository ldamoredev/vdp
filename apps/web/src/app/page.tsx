import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const modules = [
  {
    key: "tasks",
    name: "Tasks",
    description: "Organizá tu día con tareas inteligentes y asistencia de IA",
    href: "/tasks",
    iconLetter: "T",
    softBg: "var(--violet-soft-bg)",
    softText: "var(--violet-soft-text)",
    softBorder: "var(--violet-soft-border)",
    ready: true,
  },
  {
    key: "wallet",
    name: "Wallet",
    description: "Tus finanzas personales, organizadas y claras",
    href: "/wallet",
    iconLetter: "W",
    softBg: "var(--blue-soft-bg)",
    softText: "var(--blue-soft-text)",
    softBorder: "var(--blue-soft-border)",
    ready: true,
  },
  {
    key: "health",
    name: "Health",
    description: "Tu bienestar, todo en un solo lugar",
    href: "/health",
    iconLetter: "H",
    softBg: "var(--emerald-soft-bg)",
    softText: "var(--emerald-soft-text)",
    softBorder: "var(--emerald-soft-border)",
    ready: true,
  },
  {
    key: "people",
    name: "People",
    description: "Cuidá tus relaciones, no pierdas el hilo de nadie",
    href: "/people",
    iconLetter: "P",
    softBg: "var(--purple-soft-bg)",
    softText: "var(--purple-soft-text)",
    softBorder: "var(--purple-soft-border)",
    ready: false,
  },
  {
    key: "work",
    name: "Work",
    description: "Tu carrera profesional, gestionada con intención",
    href: "/work",
    iconLetter: "K",
    softBg: "var(--amber-soft-bg)",
    softText: "var(--amber-soft-text)",
    softBorder: "var(--amber-soft-border)",
    ready: false,
  },
  {
    key: "study",
    name: "Study",
    description: "Aprendé con propósito, no pierdas el rumbo",
    href: "/study",
    iconLetter: "S",
    softBg: "var(--rose-soft-bg)",
    softText: "var(--rose-soft-text)",
    softBorder: "var(--rose-soft-border)",
    ready: false,
  },
];

export default function Home() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center px-6 py-12">
      {/* Top bar with theme toggle */}
      <div className="w-full max-w-5xl flex justify-end mb-8 animate-fade-in">
        <ThemeToggle />
      </div>

      {/* Hero */}
      <div className="mb-16 text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-xl mb-8 text-xs font-medium text-[var(--muted)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse" />
          Sistema organizacional personal
        </div>
        <h1 className="text-7xl font-bold tracking-tight mb-4">
          <span className="bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--foreground-muted)] bg-clip-text text-transparent">
            VDP
          </span>
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-md mx-auto leading-relaxed">
          Tu vida digital, organizada en módulos inteligentes
        </p>
      </div>

      {/* Module grid */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {modules.map((mod) => (
          <Link
            key={mod.key}
            href={mod.href}
            className="group relative glass-card p-6 transition-all cursor-pointer overflow-hidden"
          >
            {/* Accent glow on hover */}
            <div
              className="absolute inset-0 rounded-[var(--radius-lg)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 0%, ${mod.softBg}, transparent 70%)`,
              }}
            />

            <div className="relative">
              {/* Icon + badge row */}
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{
                    background: mod.softBg,
                    color: mod.softText,
                    border: `1px solid ${mod.softBorder}`,
                  }}
                >
                  {mod.iconLetter}
                </div>
                {mod.ready ? (
                  <span
                    className="badge"
                    style={{
                      background: "var(--green-soft-bg)",
                      color: "var(--green-soft-text)",
                      border: "1px solid var(--green-soft-border)",
                    }}
                  >
                    Activo
                  </span>
                ) : (
                  <span
                    className="badge"
                    style={{
                      background: "var(--muted-bg)",
                      color: "var(--foreground-muted)",
                      border: "1px solid var(--divider)",
                    }}
                  >
                    Próximamente
                  </span>
                )}
              </div>

              {/* Name + description */}
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1.5">
                {mod.name}
              </h3>
              <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                {mod.description}
              </p>

              {/* Arrow indicator */}
              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ color: mod.softText }}>
                <span>{mod.ready ? "Abrir" : "Explorar"}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:translate-x-1 transition-transform"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-20 text-center animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        <p className="text-xs text-[var(--muted)]">
          Construido con IA
          <span className="mx-2" style={{ color: "var(--divider)" }}>|</span>
          Powered by Claude
        </p>
      </div>
    </main>
  );
}
