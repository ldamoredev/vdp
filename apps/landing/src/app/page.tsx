const modules = [
  {
    name: "Wallet",
    description: "Gestiona tus finanzas personales",
    active: true,
    href: "http://localhost:3001",
    gradient: "from-blue-500 to-blue-600",
    iconBg: "rgba(59, 130, 246, 0.15)",
    iconLetter: "W",
    iconColor: "#3B82F6",
    hoverGlow: "from-blue-500/[0.03]",
    hoverShadow: "hover:shadow-blue-500/5",
  },
  {
    name: "People",
    description: "Administra tus contactos y relaciones",
    active: true,
    href: "http://localhost:3002",
    gradient: "from-purple-500 to-purple-600",
    iconBg: "rgba(168, 85, 247, 0.15)",
    iconLetter: "P",
    iconColor: "#A855F7",
    hoverGlow: "from-purple-500/[0.03]",
    hoverShadow: "hover:shadow-purple-500/5",
  },
  {
    name: "Health",
    description: "Controla tu salud y bienestar",
    active: true,
    href: "http://localhost:3003",
    gradient: "from-emerald-500 to-emerald-600",
    iconBg: "rgba(16, 185, 129, 0.15)",
    iconLetter: "H",
    iconColor: "#10B981",
    hoverGlow: "from-emerald-500/[0.03]",
    hoverShadow: "hover:shadow-emerald-500/5",
  },
  {
    name: "Work",
    description: "Organiza tu trabajo y proyectos",
    active: true,
    href: "http://localhost:3004",
    gradient: "from-amber-500 to-amber-600",
    iconBg: "rgba(245, 158, 11, 0.15)",
    iconLetter: "W",
    iconColor: "#F59E0B",
    hoverGlow: "from-amber-500/[0.03]",
    hoverShadow: "hover:shadow-amber-500/5",
  },
  {
    name: "Study",
    description: "Planifica tu aprendizaje",
    active: true,
    href: "http://localhost:3005",
    gradient: "from-rose-500 to-rose-600",
    iconBg: "rgba(244, 63, 94, 0.15)",
    iconLetter: "S",
    iconColor: "#F43F5E",
    hoverGlow: "from-rose-500/[0.03]",
    hoverShadow: "hover:shadow-rose-500/5",
  },
];

export default function Home() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20">
      {/* Hero */}
      <div className="mb-20 text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-xl mb-8 text-xs font-medium text-[var(--muted)]">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Sistema organizacional personal
        </div>
        <h1 className="text-7xl font-bold tracking-tight text-white mb-4">
          <span className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
            VDP
          </span>
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-md mx-auto leading-relaxed">
          Tu vida, organizada en modulos inteligentes con IA
        </p>
      </div>

      {/* Module Grid */}
      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
        {modules.map((mod) => (
          <a
            key={mod.name}
            href={mod.href}
            className={`group relative rounded-2xl border border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-xl p-6 transition-all duration-300 hover:border-[var(--glass-border-hover)] hover:bg-[rgba(15,23,42,0.7)] hover:shadow-xl ${mod.hoverShadow} cursor-pointer`}
          >
            {/* Subtle hover glow */}
            <div
              className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${mod.hoverGlow} to-transparent pointer-events-none`}
            />
            <div className="relative">
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: mod.iconBg }}
              >
                <span
                  className="text-lg font-bold"
                  style={{ color: mod.iconColor }}
                >
                  {mod.iconLetter}
                </span>
              </div>

              {/* Title + Badge */}
              <div className="flex items-center gap-2.5 mb-2">
                <h2 className="text-base font-semibold text-white">
                  {mod.name}
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/12 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  Activo
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                {mod.description}
              </p>

              {/* Arrow */}
              <div
                className="mt-5 flex items-center gap-2 text-xs font-medium group-hover:gap-3 transition-all"
                style={{ color: mod.iconColor }}
              >
                <span>Abrir modulo</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Footer tag */}
      <div
        className="mt-20 text-center animate-fade-in-up"
        style={{ animationDelay: "400ms" }}
      >
        <p className="text-xs text-[var(--muted)]">
          Construido con IA
          <span className="mx-2 text-white/10">|</span>
          Powered by Claude
        </p>
      </div>
    </main>
  );
}
