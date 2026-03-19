import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const dashboardCard = {
  name: "Tasks",
  description: "El proyecto esta temporalmente enfocado en Tasks para cerrar la arquitectura, el contrato API y el chat del modulo de referencia.",
  href: "/tasks",
  gradient: "from-[var(--accent)] to-[var(--accent-secondary)]",
  iconColor: "var(--accent)",
};

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
          Modo Tasks-first para estabilizar el proyecto
        </p>
      </div>

      {/* ============================================
          TASKS — Hero Card (Full-width, primary CTA)
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
              Abrir Tasks
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
            Estado actual
          </span>
          <div className="flex-1 h-px bg-[var(--divider)]" />
        </div>
      </div>

      <div className="w-full max-w-5xl glass-card-static p-6 md:p-8 animate-fade-in-up" style={{ animationDelay: "250ms" }}>
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--violet-soft-text)]">
              Tasks only
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Alcance reducido para estabilizar el proyecto
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
              Wallet, Health y los demas dominios quedan fuera de la navegacion hasta cerrar el contrato, la validacion y el chat de Tasks. Este modulo pasa a ser la plantilla definitiva para el resto.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3 text-sm text-[var(--foreground-secondary)]">
            <div className="font-medium text-[var(--foreground)]">Meta actual</div>
            <div className="mt-1">Build verde, contrato Tasks estable y endpoint de chat activo.</div>
          </div>
        </div>
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
