import { Compass } from "lucide-react";
import { getPlanningToneClasses } from "../tasks-dashboard-selectors";
import { useTasksData } from "../use-tasks-context";

export function PlanningSignal() {
  const { planning, pendingTasks, urgentTasks, carryOverRate } = useTasksData();

  return (
    <div className={`rounded-[30px] border p-6 ${getPlanningToneClasses(planning.tone)}`}>
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
          <Compass size={12} />
          Plan del dia
        </div>
        <h3 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
          {planning.headline}
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          {planning.summary}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-[22px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3 text-center">
          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
            Pendientes
          </div>
          <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {pendingTasks.length}
          </div>
        </div>
        <div className="rounded-[22px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3 text-center">
          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
            Calientes
          </div>
          <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {urgentTasks.length}
          </div>
        </div>
        <div className="rounded-[22px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3 text-center">
          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
            Carry semanal 7d
          </div>
          <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {carryOverRate?.rate ?? 0}%
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {planning.recommendations.map((recommendation) => (
          <div
            key={recommendation}
            className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4"
          >
            <p className="text-sm leading-relaxed text-[var(--foreground)]">
              {recommendation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
