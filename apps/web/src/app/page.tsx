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
    description: "MVP de finanzas con dashboard, movimientos y resumen operativo",
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
    ready: false,
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

const activeModules = modules.filter((m) => m.ready);
const upcomingModules = modules.filter((m) => !m.ready);

export default function Home() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center px-6 py-10 md:py-16">
      {/* Top bar */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-12 animate-fade-in">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] text-white text-sm font-bold shadow-md">
            V
          </div>
          <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">VDP</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Hero */}
      <div className="mb-20 text-center animate-fade-in-up max-w-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-xl mb-8 text-xs font-medium text-[var(--muted)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse" />
          Sistema organizacional personal
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-5 leading-[0.95]">
          <span className="bg-gradient-to-b from-[var(--foreground)] to-[var(--foreground-secondary)] bg-clip-text text-transparent">
            Tu vida digital,
          </span>
          <br />
          <span className="bg-gradient-to-r from-[var(--accent)] via-[var(--accent-purple)] to-[var(--accent)] bg-clip-text text-transparent">
            organizada
          </span>
        </h1>
        <p className="text-base md:text-lg text-[var(--foreground-muted)] max-w-lg mx-auto leading-relaxed">
          Módulos inteligentes que te ayudan a gestionar cada aspecto de tu vida con claridad y propósito
        </p>
      </div>

      {/* Active modules — featured */}
      <div className="w-full max-w-5xl mb-8 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-4 rounded-full bg-[var(--accent-green)]" />
          <h2 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">Módulos activos</h2>
          <span className="text-xs text-[var(--muted)] ml-1">{activeModules.length}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {activeModules.map((mod) => (
            <Link
              key={mod.key}
              href={mod.href}
              className="group relative glass-card p-6 md:p-8 transition-all cursor-pointer overflow-hidden"
            >
              {/* Accent glow on hover */}
              <div
                className="absolute inset-0 rounded-[var(--radius-lg)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${mod.softBg}, transparent 70%)`,
                }}
              />

              {/* Top accent line */}
              <div
                className="absolute top-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(90deg, transparent, ${mod.softText}, transparent)`,
                }}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: mod.softBg,
                        color: mod.softText,
                        border: `1px solid ${mod.softBorder}`,
                      }}
                    >
                      {mod.iconLetter}
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--foreground)] tracking-tight">
                      {mod.name}
                    </h3>
                  </div>
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
                </div>

                <p className="text-sm text-[var(--foreground-muted)] leading-relaxed mb-5">
                  {mod.description}
                </p>

                <div className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ color: mod.softText }}>
                  <span>Abrir módulo</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:translate-x-1.5 transition-transform duration-300"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming modules — compact grid */}
      <div className="w-full max-w-5xl mb-20 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-4 rounded-full bg-[var(--muted)]" />
          <h2 className="text-sm font-semibold text-[var(--foreground-muted)] tracking-tight">Próximamente</h2>
          <span className="text-xs text-[var(--muted)] ml-1">{upcomingModules.length}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
          {upcomingModules.map((mod) => (
            <div
              key={mod.key}
              className="glass-card-static p-4 opacity-60"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    background: mod.softBg,
                    color: mod.softText,
                    border: `1px solid ${mod.softBorder}`,
                  }}
                >
                  {mod.iconLetter}
                </div>
                <span className="text-sm font-medium text-[var(--foreground)]">{mod.name}</span>
              </div>
              <p className="text-xs text-[var(--foreground-muted)] leading-relaxed line-clamp-2">
                {mod.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Demo video */}
      <div className="w-full max-w-4xl animate-fade-in-up mb-20" style={{ animationDelay: "300ms" }}>
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-[var(--foreground)] tracking-tight mb-2">
            Mirá VDP en acción
          </h2>
          <p className="text-sm text-[var(--muted)]">
            90 segundos para entender cómo funciona
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-xl shadow-lg group">
          {/* Top shine line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[var(--glass-border-hover)] to-transparent z-10" />
          <video
            className="w-full aspect-video"
            controls
            preload="metadata"
            poster=""
          >
            <source src="/vdp-demo.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-5xl border-t border-[var(--divider)] pt-8 pb-4 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] text-white text-[10px] font-bold">
              V
            </div>
            <span className="text-xs font-medium text-[var(--foreground-muted)]">VDP</span>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Construido con IA
            <span className="mx-2 text-[var(--divider)]">|</span>
            Powered by Claude
          </p>
        </div>
      </footer>
    </main>
  );
}
