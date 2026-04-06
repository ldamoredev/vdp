import React from "react";
import { Target, CheckCircle2 } from "lucide-react";
import { domains } from "@/lib/navigation";

function formatModuleList(labels: readonly string[]) {
  if (labels.length === 0) return "No hay modulos activos";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} y ${labels[1]}`;

  return `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`;
}

function formatModuleCount(count: number) {
  return `${count} dominio${count === 1 ? "" : "s"}`;
}

export function ProductFocusCard() {
  const activeDomains = domains.filter((domain) => !domain.disabled);
  const activeDomainLabels = activeDomains.map((domain) => domain.label);
  const activeDomainSentence = formatModuleList(activeDomainLabels);

  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
        <div className="flex items-center gap-2">
          <Target size={16} style={{ color: "var(--violet-soft-text)" }} />
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            Foco del producto
          </h3>
        </div>
        <span className="text-xs text-[var(--muted)]">{formatModuleCount(activeDomains.length)}</span>
      </div>

      <div className="space-y-4 p-4">
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
          {activeDomains.length === 1
            ? `${activeDomainSentence} es el modulo activo.`
            : `${activeDomainSentence} son los modulos activos.`}{" "}
          Los demas dominios siguen en pausa mientras consolidamos el flujo
          diario.
        </p>

        <div className="grid gap-2">
          {activeDomains.map((domain, index) => (
            <div
              key={domain.key}
              className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={14}
                  className={
                    index === 0
                      ? "text-[var(--accent-green)]"
                      : "text-[var(--accent-blue)]"
                  }
                />
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {domain.label}
                </span>
              </div>
              <span className="badge badge-muted">Activo</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
