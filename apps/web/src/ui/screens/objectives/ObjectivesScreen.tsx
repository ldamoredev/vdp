import { Archive, CalendarDays, Pencil, Plus, Target } from "lucide-react";
import { Link } from "react-router";

import { ModulePage } from "@/ui/primitives/module-page";
import { StateCard } from "@/ui/primitives/state-card";
import { useObjectivesPresenter } from "./useObjectivesPresenter";

export function ObjectivesScreen() {
  const presenter = useObjectivesPresenter();
  const vm = presenter.model;

  return (
    <ModulePage width="5xl" spacing="6" className="domain-objectives">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
            Objetivos de vida
          </p>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Metas</h1>
        </div>
        <button type="button" onClick={() => presenter.openCreateForm()} className="btn-primary">
          <Plus size={16} />
          Nueva meta
        </button>
      </header>

      {vm.form.isOpen && (
        <form
          className="glass-card-static space-y-4 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void presenter.saveForm();
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
              {vm.form.isEditing ? "Editar meta" : "Nueva meta"}
            </h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => presenter.applyCurrentQuarterPreset()} className="btn-secondary min-h-9 text-xs">
                <CalendarDays size={14} />
                Trimestre
              </button>
              <button type="button" onClick={() => presenter.applyCurrentYearPreset()} className="btn-secondary min-h-9 text-xs">
                <CalendarDays size={14} />
                Año
              </button>
            </div>
          </div>

          <Input label="Título" value={vm.form.title} onChange={(value) => presenter.setTitle(value)} />

          <div className="grid gap-3 md:grid-cols-2">
            <DateInput label="Desde" value={vm.form.periodStart} onChange={(value) => presenter.setPeriodStart(value)} />
            <DateInput label="Hasta" value={vm.form.periodEnd} onChange={(value) => presenter.setPeriodEnd(value)} />
          </div>

          <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.6fr]">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
                Métrica
              </span>
              <select
                value={vm.form.metricSource}
                onChange={(event) => presenter.setMetricSource(event.target.value as typeof vm.form.metricSource)}
                className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              >
                {vm.metricSourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Valor objetivo"
              type="number"
              value={vm.form.target}
              onChange={(value) => presenter.setTarget(value)}
            />
            <Input label="Unidad" value={vm.form.unit} onChange={(value) => presenter.setUnit(value)} />
          </div>

          {vm.form.metricSource === "manual" && (
            <Input
              label="Valor actual"
              type="number"
              value={vm.form.manualValue}
              onChange={(value) => presenter.setManualValue(value)}
            />
          )}

          {vm.form.isCurrencyScoped && (
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
                Moneda
              </span>
              <select
                value={vm.form.currency}
                onChange={(event) => presenter.setCurrency(event.target.value as "ARS" | "USD")}
                className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </label>
          )}

          {vm.form.isMetricTargetRequired && (
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
                Hábito
              </span>
              <select
                value={vm.form.metricTargetId}
                onChange={(event) => presenter.setMetricTarget(event.target.value)}
                disabled={vm.form.metricTargetOptions.length === 0}
                className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] disabled:opacity-60"
              >
                {vm.form.metricTargetOptions.length === 0 ? (
                  <option value="">Sin hábitos activos</option>
                ) : (
                  vm.form.metricTargetOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                )}
              </select>
            </label>
          )}

          {vm.form.metricSource === "wallet_savings" && (
            <WalletSavingsHint />
          )}

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={!vm.form.canSubmit} className="btn-primary">
              {vm.form.submitLabel}
            </button>
            <button type="button" onClick={() => presenter.closeForm()} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {vm.error ? (
        <StateCard state="error" title="No pudimos cargar metas" description={vm.error} />
      ) : vm.isLoading && vm.objectives.length === 0 ? (
        <StateCard state="loading" skeletonLines={4} />
      ) : vm.objectives.length === 0 ? (
        <StateCard title="Todavía no hay metas" />
      ) : (
        <section className="grid gap-3">
          {vm.objectives.map((objective) => (
            <article
              key={objective.id}
              className="glass-card-static overflow-hidden p-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-glow)] text-[var(--accent)]">
                      <Target size={16} />
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
                      {objective.sourceLabel}
                    </span>
                    <span className="font-data text-[11px] text-[var(--muted)]">{objective.statusLabel}</span>
                  </div>
                  <h2 className="mt-3 font-display text-xl font-bold leading-tight text-[var(--foreground)]">
                    {objective.title}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">{objective.periodLabel}</p>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  <button type="button" onClick={() => presenter.openEditForm(objective.id)} className="btn-secondary min-h-9 text-xs">
                    <Pencil size={14} />
                    Editar
                  </button>
                  {!objective.isArchived && (
                    <button type="button" onClick={() => void presenter.archiveObjective(objective.id)} className="btn-secondary min-h-9 text-xs">
                      <Archive size={14} />
                      Archivar
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
                      Progreso
                    </p>
                    <p className="mt-1 font-data text-2xl font-semibold text-[var(--foreground)]">
                      {objective.progressLabel}
                    </p>
                  </div>
                  <p className="font-data text-sm text-[var(--muted)]">
                    {objective.currentValueLabel} / {objective.targetValueLabel}
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--progress-track)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
                    style={{ width: `${objective.progressPercent}%` }}
                  />
                </div>
                {objective.tracksSavings && (
                  <WalletSavingsHint className="mt-3 border-l-2 border-[var(--accent)] pl-3" />
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </ModulePage>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
        {label}
      </span>
      <input
        type={type}
        step={type === "number" ? "0.01" : undefined}
        min={type === "number" ? "0" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
      />
    </label>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <Input label={label} type="date" value={value} onChange={onChange} />;
}

function WalletSavingsHint({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-[var(--muted)] ${className}`}>
      El progreso se llena con tus{" "}
      <Link to="/wallet/savings" className="font-medium text-[var(--accent)] underline-offset-2 hover:underline">
        Ahorros
      </Link>{" "}
      en esta moneda — no con ingresos ni con el saldo de tus cuentas. Creá un ahorro y cargá aportes para verlo avanzar.
    </p>
  );
}
