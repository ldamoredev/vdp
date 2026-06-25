import { Link } from "react-router";
import { ArrowRight, CheckCircle2, Loader2, RotateCcw, Sparkles, Target } from "lucide-react";
import type { HomeRitualViewModel } from "@/ui/models/home/HomeViewModel";

export interface DailyRitualCardProps {
  readonly model: HomeRitualViewModel;
  readonly onConfirmCarryOvers: () => void;
  readonly onChooseFocus: (taskId: string) => void;
}

export function DailyRitualCard({
  model,
  onConfirmCarryOvers,
  onChooseFocus,
}: DailyRitualCardProps) {
  const morning = model.morning;

  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[var(--glass-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: "var(--violet-soft-text)" }} />
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            Ritual diario
          </h3>
        </div>
        <span className="rounded-full border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--foreground)]">
          {model.statusLabel}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-2xl border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                <Target size={15} style={{ color: "var(--violet-soft-text)" }} />
                Plan del día
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {morning.summary}
              </p>
              {morning.plannedAtLabel ? (
                <p className="mt-2 text-xs font-data text-[var(--violet-soft-text)]">
                  {morning.plannedAtLabel}
                </p>
              ) : null}
            </div>
            <span className="w-fit rounded-full border border-[var(--glass-border)] bg-[var(--surface)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--foreground)]">
              {morning.statusLabel}
            </span>
          </div>

          {morning.carryOverTasks.length > 0 ? (
            <div className="mt-4 rounded-xl border border-[var(--glass-border)] bg-[var(--surface)] p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                    Carry-over de ayer
                  </div>
                  <div className="mt-1 text-sm font-data text-[var(--foreground)]">
                    {morning.carryOverCountLabel}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onConfirmCarryOvers}
                  disabled={!morning.canConfirmCarryOvers}
                  className="btn-secondary inline-flex items-center justify-center gap-2 px-3 py-2 text-xs disabled:opacity-40"
                >
                  {morning.isConfirmingCarryOvers ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RotateCcw size={13} />
                  )}
                  Traer a hoy
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {morning.carryOverTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-[var(--hover-overlay)] px-3 py-2"
                  >
                    <span className="min-w-0 truncate text-sm text-[var(--foreground)]">
                      {task.title}
                    </span>
                    <span className="shrink-0 text-xs text-[var(--muted)]">
                      {task.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {morning.focusOptions.length > 0 ? (
            <div className="mt-4">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                Foco de hoy
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {morning.focusOptions.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onChooseFocus(task.id)}
                    disabled={morning.isSavingFocus}
                    className={`rounded-full border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
                      task.selected
                        ? "border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)] text-[var(--foreground)]"
                        : "border-[var(--glass-border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {morning.error ? (
            <div className="mt-4 rounded-xl border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] p-3 text-sm text-[var(--red-soft-text)]">
              {morning.error}
            </div>
          ) : null}
        </div>

        <div className="pt-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          Cierre del día
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
            <div className="text-xs text-[var(--muted)]">Tareas</div>
            <div className="mt-1 text-2xl font-data font-bold tracking-tight text-[var(--foreground)]">
              {model.taskCount}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
            <div className="text-xs text-[var(--muted)]">Wallet</div>
            <div className="mt-1 text-2xl font-data font-bold tracking-tight text-[var(--foreground)]">
              {model.walletCount}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
            <div className="text-xs text-[var(--muted)]">Alertas</div>
            <div className="mt-1 text-2xl font-data font-bold tracking-tight text-[var(--foreground)]">
              {model.insightCount}
            </div>
          </div>
        </div>

        {model.noteSummary ? (
          <div className="rounded-xl border border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)] p-3 text-sm text-[var(--foreground)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[var(--emerald-soft-text)]" />
              {model.noteSummary}
            </div>
          </div>
        ) : null}

        <Link
          to={model.href}
          className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] px-3 py-3 text-sm font-medium transition-colors sm:w-auto sm:justify-start"
          style={{ color: "var(--violet-soft-text)" }}
        >
          {model.ctaLabel}
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
