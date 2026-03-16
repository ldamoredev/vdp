import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const dashboardCard = {
  name: "Dashboard",
  description: "Tu centro de comando personal. Visualiza el estado de todos tus modulos en un solo lugar.",
  href: "/home",
  gradient: "from-[var(--accent)] to-[var(--accent-secondary)]",
  iconColor: "var(--accent)",
};

const modules = [
  {
    name: "Tasks",
    description: "Tu lista diaria con foco, prioridad y seguimiento inteligente",
    active: true,
    href: "/tasks",
    iconBg: "var(--violet-soft-bg)",
    iconLetter: "T",
    iconColor: "#8B5CF6",
    softText: "var(--violet-soft-text)",
    softBorder: "var(--violet-soft-border)",
    features: ["Prioridades", "Carry-over", "Agente IA"],
  },
  {
    name: "Wallet",
    description: "Gestiona tus finanzas personales",
    active: true,
    href: "/wallet",
    iconBg: "var(--blue-soft-bg)",
    iconLetter: "W",
    iconColor: "#3B82F6",
    softText: "var(--blue-soft-text)",
    softBorder: "var(--blue-soft-border)",
  },
  {
    name: "Health",
    description: "Controla tu salud y bienestar",
    active: true,
    href: "/health",
    iconBg: "var(--emerald-soft-bg)",
    iconLetter: "H",
    iconColor: "#10B981",
    softText: "var(--emerald-soft-text)",
    softBorder: "var(--emerald-soft-border)",
  },
  {
    name: "People",
    description: "Administra tus contactos y relaciones",
    active: false,
    href: "/people",
    iconBg: "var(--purple-soft-bg)",
    iconLetter: "P",
    iconColor: "#A855F7",
    softText: "var(--purple-soft-text)",
    softBorder: "var(--purple-soft-border)",
  },
  {
    name: "Work",
    description: "Organiza tu trabajo y proyectos",
    active: false,
    href: "/work",
    iconBg: "var(--amber-soft-bg)",
    iconLetter: "W",
    iconColor: "#F59E0B",
    softText: "var(--amber-soft-text)",
    softBorder: "var(--amber-soft-border)",
  },
  {
    name: "Study",
    description: "Planifica tu aprendizaje",
    active: false,
    href: "/study",
    iconBg: "var(--rose-soft-bg)",
    iconLetter: "S",
    iconColor: "#F43F5E",
    softText: "var(--rose-soft-text)",
    softBorder: "var(--rose-soft-border)",
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
          Tu vida, organizada en modulos inteligentes con IA
        </p>
      </div>

      {/* ============================================
          DASHBOARD — Hero Card (Full-width, primary CTA)
          ============================================ */}
      <Link
        href={dashboardCard.href}
        className="group relative w-full max-w-5xl rounded-2xl border border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-xl p-8 md:p-10 transition-all duration-300 hover:border-[var(--glass-border-hover)] hover:shadow-xl cursor-pointer animate-fade-in-up overflow-hidden"
        style={{ animationDelay: "100ms" }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--accent-glow)] via-transparent to-[var(--accent-green-glow)] opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        {/* Glow border on hover */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[var(--accent)] via-transparent to-[var(--accent-green)] opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none blur-sm" />

        <div className="relative flex flex-col md:flex-row gap-8 items-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] shadow-lg group-hover:scale-105 transition-transform duration-300"
               style={{ boxShadow: `0 8px 24px var(--accent-glow)` }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
          </div>

          {/* Text content */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-semibold text-[var(--foreground)] mb-2">
              {dashboardCard.name}
            </h2>
            <p className="text-[var(--foreground-muted)] max-w-lg leading-relaxed">
              {dashboardCard.description}
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-3">
            <span className="btn-primary text-base px-6 py-3 group-hover:shadow-lg transition-all">
              Entrar
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>

      {/* ============================================
          DIVIDER — Visual separation
          ============================================ */}
      <div className="w-full max-w-5xl mt-14 mb-10 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-[var(--divider)]" />
          <span className="text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
            Modulos
          </span>
          <div className="flex-1 h-px bg-[var(--divider)]" />
        </div>
      </div>

      {/* ============================================
          MODULES GRID — Secondary cards (2-3 cols)
          ============================================ */}
      <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
        {modules.map((mod) => (
          <Link
            key={mod.name}
            href={mod.active ? mod.href : "#"}
            className={`group relative rounded-2xl border border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-xl p-6 transition-all duration-300 ${
              mod.active
                ? "hover:border-[var(--glass-border-hover)] hover:shadow-lg cursor-pointer"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            {/* Hover gradient overlay */}
            {mod.active && (
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                   style={{ background: `linear-gradient(to bottom right, color-mix(in srgb, ${mod.iconColor} 6%, transparent), transparent)` }} />
            )}
            <div className="relative">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: mod.iconBg }}
              >
                <span className="text-lg font-bold" style={{ color: mod.softText }}>
                  {mod.iconLetter}
                </span>
              </div>

              <div className="flex items-center gap-2.5 mb-2">
                <h2 className="text-base font-semibold text-[var(--foreground)]">{mod.name}</h2>
                {mod.active ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ background: "var(--emerald-soft-bg)", color: "var(--emerald-soft-text)", border: "1px solid var(--emerald-soft-border)" }}>
                    <span className="w-1 h-1 rounded-full" style={{ background: "var(--emerald-soft-text)" }} />
                    Activo
                  </span>
                ) : (
                  <span className="badge badge-muted text-[10px] font-semibold uppercase tracking-wider">
                    Pronto
                  </span>
                )}
              </div>

              <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">{mod.description}</p>

              {/* Features tags (if any) */}
              {mod.features && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {mod.features.map((f: string) => (
                    <span
                      key={f}
                      className="px-3 py-1 rounded-lg text-[11px] font-medium bg-[var(--hover-overlay-strong)] text-[var(--foreground-secondary)] border border-[var(--divider)]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}

              <div
                className={`mt-5 flex items-center gap-2 text-xs font-medium transition-all ${mod.active ? "group-hover:gap-3" : ""}`}
                style={{ color: mod.active ? mod.softText : "var(--muted)" }}
              >
                <span>{mod.active ? "Abrir modulo" : "Proximamente"}</span>
                {mod.active && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                )}
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
