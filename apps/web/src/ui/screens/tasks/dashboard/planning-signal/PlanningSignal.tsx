import { Compass } from "lucide-react";

import { usePlanningSignalPresenter } from "./usePlanningSignalPresenter";

export function PlanningSignal() {
  const presenter = usePlanningSignalPresenter();
  const vm = presenter.model;

  return (
    <div aria-busy={vm.isLoading} className={`rounded-2xl border p-5 md:p-6 ${vm.toneClass}`}>
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-[var(--muted)]">
          <Compass size={11} />
          {vm.eyebrow}
        </div>
        <h3 className="mt-3 text-xl font-bold tracking-tight text-[var(--foreground)]">
          {vm.headline}
        </h3>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          {vm.summary}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {vm.metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2.5 text-center"
          >
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
              {metric.label}
            </div>
            <div className="mt-1.5 text-2xl font-data font-bold tracking-tight text-[var(--foreground)]">
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-2.5 md:grid-cols-3">
        {vm.recommendations.map((recommendation) => (
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
