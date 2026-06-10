import { Compass } from "lucide-react";
import { getPlanningToneClasses } from "../tasks-dashboard-selectors";
import { useTasksData } from "../use-tasks-context";

export function PlanningSignal() {
  const { planning, pendingTasks, urgentTasks, carryOverRate } = useTasksData();

  return (
    <div className={`rounded-2xl border p-5 md:p-6 ${getPlanningToneClasses(planning.tone)}`}>
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-[var(--muted)]">
          <Compass size={11} />
          Plan del dia
        </div>
        <h3 className="mt-3 text-xl font-bold tracking-tight text-[var(--foreground)]">
          {planning.headline}
        </h3>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          {planning.summary}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2.5 text-center">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)] font-medium">
            Pendientes
          </div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {pendingTasks.length}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2.5 text-center">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)] font-medium">
            Calientes
          </div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {urgentTasks.length}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2.5 text-center">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)] font-medium">
            Carry 7d
          </div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {carryOverRate?.rate ?? 0}%
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2.5 md:grid-cols-3">
        {planning.recommendations.map((recommendation) => (
          <div
            key={recommendation}
            className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3.5"
          >
            <p className="text-[13px] leading-relaxed text-[var(--foreground)]">
              {recommendation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
