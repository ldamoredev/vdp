import { ArrowLeft, Printer } from "lucide-react";
import { Link } from "react-router";

import { StateCard } from "@/ui/primitives/state-card";
import { useHoursReportPrintPresenter } from "./useHoursReportPrintPresenter";

export function HoursReportPrintScreen() {
  const presenter = useHoursReportPrintPresenter();
  const vm = presenter.model;

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-6 md:py-10 domain-projects print:p-0">
      {/* Toolbar — hidden from the printed page. */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft size={15} />
          Proyectos
        </Link>
        <button
          type="button"
          disabled={vm.isLoading || !vm.hasRows}
          onClick={() => window.print()}
          className="btn-primary"
        >
          <Printer size={16} />
          Imprimir / Guardar PDF
        </button>
      </div>

      {vm.error ? (
        <StateCard state="error" size="sm" title="No pudimos generar el reporte" description={vm.error} />
      ) : vm.isLoading && !vm.hasRows ? (
        <StateCard state="loading" size="sm" skeletonLines={4} />
      ) : (
        <article className="print-document rounded-[var(--radius-lg)] border border-[var(--divider)] bg-[var(--card)] p-8 text-[var(--foreground)]">
          <header className="mb-6 border-b border-[var(--divider)] pb-4">
            <p className="text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
              Reporte de horas
            </p>
            <h1 className="font-display text-2xl font-bold">Horas por proyecto</h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
              <span>{vm.periodLabel}</span>
              <span>·</span>
              <span>Generado el {vm.generatedAtLabel}</span>
            </div>
          </header>

          {!vm.hasRows ? (
            <p className="text-sm text-[var(--muted)]">Sin horas registradas en el rango elegido.</p>
          ) : (
            <>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--divider)] text-left text-[var(--muted)]">
                    <th className="py-2 pr-3 font-medium">Proyecto</th>
                    <th className="py-2 pr-3 font-medium">Cliente</th>
                    <th className="py-2 pr-3 font-medium">Semana</th>
                    <th className="py-2 pr-3 text-right font-medium">Horas</th>
                    <th className="py-2 text-right font-medium">Ingreso esperado</th>
                  </tr>
                </thead>
                <tbody>
                  {vm.rows.map((row) => (
                    <tr key={row.key} className="border-b border-[var(--divider)] align-top">
                      <td className="py-2 pr-3">{row.projectOutcome}</td>
                      <td className="py-2 pr-3 text-[var(--muted)]">{row.clientName ?? "—"}</td>
                      <td className="py-2 pr-3 text-[var(--muted)]">{row.weekLabel}</td>
                      <td className="py-2 pr-3 text-right font-data">{row.durationLabel}</td>
                      <td className="py-2 text-right font-data">{row.expectedIncomeLabel ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--divider)] pt-4 text-sm">
                <span className="font-data font-semibold">Total · {vm.totalLabel}</span>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {vm.incomeTotals.map((income) => (
                    <span key={income.currency} className="font-data">
                      Ingreso esperado {income.currency} · {income.amountLabel}
                    </span>
                  ))}
                </div>
              </footer>
            </>
          )}
        </article>
      )}
    </div>
  );
}
