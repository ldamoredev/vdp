import React from "react";
import { Target, CheckCircle2 } from "lucide-react";

export function ProductFocusCard() {
  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
        <div className="flex items-center gap-2">
          <Target size={16} style={{ color: "var(--violet-soft-text)" }} />
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            Foco del producto
          </h3>
        </div>
        <span className="text-xs text-[var(--muted)]">2 dominios</span>
      </div>

      <div className="space-y-4 p-4">
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
          Tasks y Wallet son los modulos activos. Los demas dominios siguen en
          pausa mientras consolidamos el flujo diario.
        </p>

        <div className="grid gap-2">
          <div className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[var(--accent-green)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">
                Tasks
              </span>
            </div>
            <span className="badge badge-muted">Activo</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[var(--accent-blue)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">
                Wallet
              </span>
            </div>
            <span className="badge badge-muted">Activo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
