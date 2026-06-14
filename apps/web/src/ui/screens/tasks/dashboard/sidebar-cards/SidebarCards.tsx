import { AlertTriangle, BarChart3, Sparkles } from "lucide-react";

import { TaskDomainBadge } from "@/ui/screens/tasks/components/task-domain-badge";
import { TaskPriorityBadge } from "@/ui/screens/tasks/components/task-priority-badge";
import type {
  NextBestActionVM,
  RecoveryBoardVM,
  WeeklyRhythmVM,
} from "@/ui/models/tasks/SidebarCardsViewModel";
import { useSidebarCardsPresenter } from "./useSidebarCardsPresenter";

export function SidebarCards() {
  const presenter = useSidebarCardsPresenter();
  const vm = presenter.model;

  return (
    <>
      <NextBestAction vm={vm.nextBestAction} />
      <RecoveryBoard vm={vm.recovery} />
      <WeeklyRhythm vm={vm.weeklyRhythm} />
    </>
  );
}

function NextBestAction({ vm }: { vm: NextBestActionVM }) {
  return (
    <div className="glass-card-static p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={15} style={{ color: "var(--violet-soft-text)" }} />
        <h3 className="text-sm font-medium text-[var(--foreground)]">{vm.title}</h3>
      </div>

      {vm.task ? (
        <div className="mt-4 rounded-[24px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            {vm.task.eyebrow}
          </div>
          <div className="mt-2 text-base font-medium text-[var(--foreground)]">
            {vm.task.title}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <TaskPriorityBadge priority={vm.task.priority} />
            <TaskDomainBadge domain={vm.task.domain} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{vm.task.reason}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">{vm.emptyText}</p>
      )}
    </div>
  );
}

function RecoveryBoard({ vm }: { vm: RecoveryBoardVM }) {
  return (
    <div className="glass-card-static p-5">
      <div className="flex items-center gap-2">
        <AlertTriangle size={15} style={{ color: "var(--amber-soft-text)" }} />
        <h3 className="text-sm font-medium text-[var(--foreground)]">{vm.title}</h3>
      </div>

      <div className="mt-4 space-y-3">
        {vm.metrics.map((metric) => (
          <div key={metric.label} className={`rounded-2xl border p-4 ${metric.className}`}>
            <div className="text-xs text-[var(--muted)]">{metric.label}</div>
            <div className="mt-1 text-2xl font-data font-semibold text-[var(--foreground)]">
              {metric.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyRhythm({ vm }: { vm: WeeklyRhythmVM }) {
  return (
    <div className="glass-card-static p-5">
      <div className="flex items-center gap-2">
        <BarChart3 size={15} style={{ color: "var(--violet-soft-text)" }} />
        <h3 className="text-sm font-medium text-[var(--foreground)]">{vm.title}</h3>
      </div>

      {vm.days.length > 0 ? (
        <div className="mt-5 flex gap-2">
          {vm.days.map((day) => (
            <div key={day.date} aria-current={day.today ? "date" : undefined} className="flex-1 text-center">
              <div className="mb-2 flex h-24 items-end justify-center">
                <div
                  className={`w-full max-w-[26px] rounded-t-xl ${day.barClassName}`}
                  style={{ height: `${day.heightPercent}%` }}
                />
              </div>
              <div className="text-[9px] text-[var(--muted)]">{day.dateLabel}</div>
              <div className="text-[10px] font-data font-medium text-[var(--foreground)]">
                {day.completionRateLabel}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">{vm.emptyText}</p>
      )}
    </div>
  );
}
