import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  History,
  PieChart,
  Sparkles,
  Trash2,
} from "lucide-react";

import { ModuleHeader } from "@/ui/primitives/module-header";
import { ModulePage } from "@/ui/primitives/module-page";
import { StateCard } from "@/ui/primitives/state-card";
import { TaskDomainBadge } from "@/ui/screens/tasks/components/task-domain-badge";
import { TaskPriorityBadge } from "@/ui/screens/tasks/components/task-priority-badge";
import type {
  HistoryClosureQueueVM,
  HistoryClosureTaskVM,
  HistoryDomainStatsVM,
  HistoryHeaderVM,
  HistoryMetricVM,
  HistorySidebarVM,
  HistorySignalVM,
  HistoryTaskListVM,
  HistoryTrendVM,
} from "@/ui/models/tasks/HistoryViewModel";
import { useHistoryPresenter } from "./useHistoryPresenter";

export function HistoryScreen() {
  const presenter = useHistoryPresenter();
  const vm = presenter.model;

  return (
    <ModulePage width="6xl" spacing="8">
      <HistoryReviewHeader
        vm={vm.header}
        onBack={() => presenter.goBack()}
        onForward={() => presenter.goForward()}
      />
      <HistoryReviewSignals signals={vm.signals} />

      <section className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
        <HistoryClosureQueue
          vm={vm.closureQueue}
          onCarryOverAll={() => void presenter.carryOverAll()}
          onCarryOverTask={(id) => void presenter.carryOverTask(id)}
          onDiscardTask={(id) => void presenter.discardTask(id)}
        />
        <HistorySidebar vm={vm.sidebar} />
      </section>

      {vm.trend && <HistoryTrendChart vm={vm.trend} />}
      {vm.domainStats && <HistoryDomainStats vm={vm.domainStats} />}

      {vm.error && (
        <p className="text-sm text-[var(--red-soft-text)]">
          No se pudo cargar el historial. Probá recargar la página.
        </p>
      )}
    </ModulePage>
  );
}

function HistoryReviewHeader({
  vm,
  onBack,
  onForward,
}: {
  vm: HistoryHeaderVM;
  onBack: () => void;
  onForward: () => void;
}) {
  return (
    <section className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--glass-border)] p-6">
        <ModuleHeader
          eyebrow={vm.eyebrow}
          title={vm.title}
          icon={<History size={20} />}
          description={vm.description}
          actions={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="rounded-xl p-2 text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)]"
                title="Día anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} style={{ color: "var(--violet-soft-text)" }} />
                  <span className="text-sm font-medium text-[var(--foreground)]">{vm.dateLabel}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onForward}
                disabled={vm.isToday}
                className="rounded-xl p-2 text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-30"
                title="Día siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          }
        />
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-4">
        {vm.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>
    </section>
  );
}

function MetricCard({ metric }: { metric: HistoryMetricVM }) {
  return (
    <div className={`rounded-[24px] border p-4 ${metric.className}`}>
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{metric.label}</div>
      <div className="mt-2 text-3xl font-data font-semibold text-[var(--foreground)]">
        {metric.value}
      </div>
    </div>
  );
}

function HistoryReviewSignals({ signals }: { signals: HistorySignalVM[] }) {
  if (signals.length === 0) return null;
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {signals.map((signal) => (
        <div key={signal.title} className={`rounded-[28px] border p-5 ${signal.toneClass}`}>
          <div className="flex items-center gap-2 text-[var(--foreground)]">
            <Sparkles size={14} />
            <h3 className="text-sm font-medium">{signal.title}</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{signal.detail}</p>
        </div>
      ))}
    </section>
  );
}

function HistoryClosureQueue({
  vm,
  onCarryOverAll,
  onCarryOverTask,
  onDiscardTask,
}: {
  vm: HistoryClosureQueueVM;
  onCarryOverAll: () => void;
  onCarryOverTask: (id: string) => void;
  onDiscardTask: (id: string) => void;
}) {
  return (
    <div className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--glass-border)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">{vm.title}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{vm.description}</p>
          </div>

          <button
            type="button"
            onClick={onCarryOverAll}
            disabled={!vm.canCarryOverAll}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-4 py-2 text-sm font-medium text-[var(--amber-soft-text)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CalendarRange size={15} />
            Mover todo a {vm.nextDateLabel}
          </button>
        </div>
      </div>

      <div className="space-y-3 p-5">
        {vm.emptyState && (
          <StateCard
            tone="soft"
            size="lg"
            icon={
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--emerald-soft-bg)]">
                <Check size={24} style={{ color: "var(--emerald-soft-text)" }} />
              </div>
            }
            title={vm.emptyState.title}
            description={vm.emptyState.description}
          />
        )}

        {vm.items.map((task) => (
          <HistoryClosureTask
            key={task.id}
            task={task}
            onCarryOver={() => onCarryOverTask(task.id)}
            onDiscard={() => onDiscardTask(task.id)}
          />
        ))}
      </div>
    </div>
  );
}

function HistoryClosureTask({
  task,
  onCarryOver,
  onDiscard,
}: {
  task: HistoryClosureTaskVM;
  onCarryOver: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">{task.title}</span>
            {task.carryOverLabel && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--amber-soft-border)] bg-[var(--hover-overlay)] px-2 py-1 text-[10px] font-medium text-[var(--amber-soft-text)]">
                <AlertTriangle size={10} />
                {task.carryOverLabel}
              </span>
            )}
            {task.stuckLabel && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] px-2 py-1 text-[10px] font-medium text-[var(--red-soft-text)]">
                {task.stuckLabel}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TaskPriorityBadge priority={task.priority} />
            <TaskDomainBadge domain={task.domain} />
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{task.decisionText}</p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            type="button"
            onClick={onCarryOver}
            disabled={task.busy}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--hover-overlay)] px-3 py-2 text-xs font-medium text-[var(--amber-soft-text)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowRight size={13} />
            {task.carryOverActionLabel}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            disabled={task.busy}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] px-3 py-2 text-xs font-medium text-[var(--red-soft-text)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={13} />
            Cerrar sin arrastrar
          </button>
        </div>
      </div>
    </div>
  );
}

function HistorySidebar({ vm }: { vm: HistorySidebarVM }) {
  return (
    <div className="space-y-6">
      <div className="glass-card-static p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} style={{ color: "var(--amber-soft-text)" }} />
          <h3 className="text-sm font-medium text-[var(--foreground)]">{vm.status.title}</h3>
        </div>

        <div className="mt-4 space-y-3">
          {vm.status.metrics.map((metric) => (
            <div key={metric.label} className={`rounded-2xl border p-4 ${metric.className}`}>
              <div className="text-xs text-[var(--muted)]">{metric.label}</div>
              <div className="mt-1 text-2xl font-data font-semibold text-[var(--foreground)]">
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <HistoryTaskList vm={vm.completed} icon="completed" />
      {vm.discarded.count > 0 && <HistoryTaskList vm={vm.discarded} icon="discarded" />}
    </div>
  );
}

function HistoryTaskList({ vm, icon }: { vm: HistoryTaskListVM; icon: "completed" | "discarded" }) {
  const Icon = icon === "completed" ? Check : Trash2;
  const color = icon === "completed" ? "var(--emerald-soft-text)" : "var(--red-soft-text)";
  return (
    <div className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--glass-border)] p-4">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color }} />
          <h3 className="text-sm font-medium text-[var(--foreground)]">{vm.title}</h3>
          <span className="ml-auto text-xs text-[var(--muted)]">{vm.count}</span>
        </div>
      </div>
      <div className="divide-y divide-[var(--glass-border)]">
        {vm.items.length > 0 ? (
          vm.items.map((task) => (
            <div key={task.id} className="p-3">
              <div className="text-sm text-[var(--muted)] line-through">{task.title}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <TaskPriorityBadge priority={task.priority} />
                <TaskDomainBadge domain={task.domain} />
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-xs text-[var(--muted)]">{vm.emptyText}</div>
        )}
      </div>
    </div>
  );
}

function HistoryTrendChart({ vm }: { vm: HistoryTrendVM }) {
  return (
    <section className="glass-card-static p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--violet-soft-bg)]">
          <BarChart3 size={15} style={{ color: "var(--violet-soft-text)" }} />
        </div>
        <div>
          <h3 className="text-sm font-medium">{vm.title}</h3>
          <p className="text-xs text-[var(--muted)]">{vm.description}</p>
        </div>
      </div>
      <div className="flex gap-1.5">
        {vm.days.map((day) => (
          <div key={day.date} className="flex-1 text-center">
            <div className="mb-2 flex h-28 items-end justify-center">
              <div
                className="w-full max-w-[24px] rounded-t-lg transition-all"
                style={{
                  background: day.selected
                    ? "linear-gradient(to top, var(--violet-soft-border), var(--violet-soft-text))"
                    : "linear-gradient(to top, var(--violet-soft-bg), var(--violet-soft-border))",
                  opacity: day.selected ? 1 : 0.7,
                  height: `${day.heightPercent}%`,
                }}
              />
            </div>
            <div
              className={`text-[9px] ${day.selected ? "font-medium" : "text-[var(--muted)]"}`}
              style={day.selected ? { color: "var(--violet-soft-text)" } : undefined}
            >
              {day.dayLabel}
            </div>
            <div
              className="text-[9px] font-data font-medium"
              style={day.selected ? { color: "var(--violet-soft-text)" } : undefined}
            >
              {day.completionRateLabel}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HistoryDomainStats({ vm }: { vm: HistoryDomainStatsVM }) {
  return (
    <section className="glass-card-static p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--violet-soft-bg)]">
          <PieChart size={15} style={{ color: "var(--violet-soft-text)" }} />
        </div>
        <div>
          <h3 className="text-sm font-medium">{vm.title}</h3>
          <p className="text-xs text-[var(--muted)]">{vm.description}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {vm.items.map((stat) => (
          <div key={stat.key} className="glass-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className={`badge text-[10px] ${stat.domainClassName}`}>{stat.domainLabel}</span>
            </div>
            <div className="text-lg font-data font-bold text-[var(--foreground)]">
              {stat.completedLabel}
            </div>
            <div className="text-[10px] text-[var(--muted)]">{stat.totalLabel}</div>
            <div className="progress-bar mt-2">
              <div className="progress-bar-fill green" style={{ width: `${stat.rate}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
