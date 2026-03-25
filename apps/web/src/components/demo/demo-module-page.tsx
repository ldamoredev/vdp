"use client";

import Link from "next/link";

interface FeatureCard {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

interface MockPreviewItem {
  readonly label: string;
  readonly value: string;
  readonly accent?: boolean;
}

interface DemoModuleConfig {
  readonly name: string;
  readonly tagline: string;
  readonly heroDescription: string;
  readonly iconLetter: string;
  readonly features: readonly FeatureCard[];
  readonly previewTitle: string;
  readonly previewItems: readonly MockPreviewItem[];
  readonly previewChart?: readonly number[];
  readonly softBg: string;
  readonly softText: string;
  readonly softBorder: string;
}

export function DemoModulePage({ config }: { readonly config: DemoModuleConfig }) {
  return (
    <div className="max-w-5xl space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
            style={{
              background: config.softBg,
              color: config.softText,
              border: `1px solid ${config.softBorder}`,
            }}
          >
            {config.iconLetter}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              {config.name}
            </h1>
            <p className="text-sm text-[var(--muted)]">{config.tagline}</p>
          </div>
        </div>
        <Link
          href="/"
          className="btn-secondary text-xs px-3 py-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Dashboard
        </Link>
      </div>

      {/* Hero description */}
      <div className="glass-card-static p-8 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 30% 0%, ${config.softBg}, transparent 60%)`,
          }}
        />
        <div className="relative max-w-2xl">
          <p className="text-base leading-relaxed text-[var(--foreground-secondary)]">
            {config.heroDescription}
          </p>
        </div>
        <div className="relative mt-4">
          <span
            className="badge"
            style={{
              background: config.softBg,
              color: config.softText,
              border: `1px solid ${config.softBorder}`,
            }}
          >
            En desarrollo
          </span>
        </div>
      </div>

      {/* Planned features */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
          Funcionalidades planificadas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
          {config.features.map((feature) => (
            <div key={feature.title} className="glass-card-static p-5">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                  style={{
                    background: config.softBg,
                    border: `1px solid ${config.softBorder}`,
                  }}
                >
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual preview */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
          Vista previa
        </h2>
        <div className="glass-card-static overflow-hidden">
          <div
            className="flex items-center justify-between border-b p-4"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <h3 className="text-sm font-medium text-[var(--foreground)]">
              {config.previewTitle}
            </h3>
            <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">
              Demo
            </span>
          </div>

          {/* Mock chart bars */}
          {config.previewChart && (
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-end gap-2 h-24">
                {config.previewChart.map((value, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${value}%`,
                        background: `linear-gradient(to top, ${config.softBg}, color-mix(in srgb, ${config.softText} 40%, transparent))`,
                        border: `1px solid ${config.softBorder}`,
                        borderBottom: "none",
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                {config.previewChart.map((_, i) => (
                  <div key={i} className="flex-1 text-center text-[10px] text-[var(--muted)]">
                    {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][i] ?? ""}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mock list items */}
          <div className="divide-y divide-[var(--divider)]">
            {config.previewItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-6 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: item.accent ? config.softText : "var(--muted)",
                    }}
                  />
                  <span className="text-sm text-[var(--foreground)]">{item.label}</span>
                </div>
                <span
                  className="text-sm font-medium"
                  style={{
                    color: item.accent ? config.softText : "var(--foreground-muted)",
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-xl">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: config.softText }}
          />
          <span className="text-xs text-[var(--muted)]">
            Este módulo está en desarrollo activo
          </span>
        </div>
      </div>
    </div>
  );
}
