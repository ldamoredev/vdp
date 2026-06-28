import { BarChart3 } from "lucide-react";
import { Link } from "react-router";

import { StateCard } from "@/ui/primitives/state-card";
import { useHoursReportPresenter } from "./useHoursReportPresenter";

export function HoursReportSection() {
  const presenter = useHoursReportPresenter();
  const vm = presenter.model;

  return (
    <section className="glass-card-static overflow-hidden">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--divider)] p-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
            Reporte
          </p>
          <h2 className="mt-1 flex items-center gap-2 font-display text-xl font-bold leading-tight text-[var(--foreground)]">
            <BarChart3 size={18} />
            Horas por proyecto
          </h2>
        </div>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void presenter.reload();
          }}
        >
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
              Desde
            </span>
            <input
              type="date"
              value={vm.fromDate}
              onChange={(event) => presenter.setFromDate(event.target.value)}
              className="min-h-10 rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
              Hasta
            </span>
            <input
              type="date"
              value={vm.toDate}
              onChange={(event) => presenter.setToDate(event.target.value)}
              className="min-h-10 rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <button type="submit" className="btn-secondary min-h-10">
            Generar
          </button>
        </form>
      </header>

      <div className="p-4">
        {vm.error ? (
          <StateCard state="error" size="sm" title="No pudimos generar el reporte" description={vm.error} />
        ) : vm.isLoading && vm.rows.length === 0 ? (
          <StateCard state="loading" size="sm" skeletonLines={3} />
        ) : vm.rows.length === 0 ? (
          <StateCard size="sm" title="Sin horas en el rango" description="Ajustá las fechas o registrá tiempo." />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
              <span className="font-data">Total del rango · {vm.totalLabel}</span>
              {vm.incomeTotals.map((income) => (
                <span key={income.currency} className="font-data">
                  Ingreso esperado {income.currency} · {income.amountLabel}
                </span>
              ))}
            </div>
            <ul className="space-y-1">
              {vm.rows.map((row) => (
                <li
                  key={row.key}
                  className="flex flex-col gap-3 rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--card)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">{row.projectOutcome}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {row.clientName ? `${row.clientName} · ` : ""}
                      {row.weekLabel}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <span className="font-data text-sm text-[var(--foreground)]">{row.durationLabel}</span>
                    {row.expectedIncomeLabel ? (
                      <span className="font-data text-sm text-[var(--foreground)]">{row.expectedIncomeLabel}</span>
                    ) : null}
                    {row.registerIncomeHref ? (
                      <Link to={row.registerIncomeHref} className="btn-secondary min-h-9 text-xs">
                        Registrar ingreso
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
