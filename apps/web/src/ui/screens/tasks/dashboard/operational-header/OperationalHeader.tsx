import { Link } from "react-router";
import { BarChart3, CalendarClock, Flame, History, ListChecks, Target } from "lucide-react";

import { ModuleHeader } from "@/ui/primitives/module-header";
import { StatTile } from "@/ui/primitives/stat-tile";
import { useOperationalHeaderPresenter } from "./useOperationalHeaderPresenter";

export function OperationalHeader() {
  const presenter = useOperationalHeaderPresenter();
  const vm = presenter.model;

  return (
    <div className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--divider)] p-5 md:p-6">
        <ModuleHeader
          eyebrow="Centro operativo"
          title="Ejecutá hoy sin perder el hilo"
          icon={<ListChecks size={20} />}
          description="Este tablero está sincronizado con el chat. Las acciones del asistente y las manuales impactan la misma cola de trabajo en tiempo real."
          actions={
            <>
              <button
                type="button"
                onClick={() => void presenter.reschedule()}
                disabled={!vm.canReschedule}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-3.5 py-2 text-[13px] font-medium text-[var(--amber-soft-text)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CalendarClock size={14} />
                Reprogramar
              </button>
              <Link
                to="/tasks/history"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3.5 py-2 text-[13px] font-medium text-[var(--foreground)] transition-all hover:translate-y-[-1px] hover:bg-[var(--hover-overlay-strong)]"
              >
                <History size={14} />
                Historial
              </Link>
            </>
          }
        />
      </div>

      <div className="grid gap-3 p-5 md:p-6 md:grid-cols-3">
        <StatTile
          label="Cumplimiento"
          value={vm.completionRate}
          unit={`% · ${vm.completed}/${vm.total}`}
          tone="accent"
          icon={<Target size={15} />}
          progressValue={vm.completionRate}
        />

        <StatTile
          label="Presión/Recuperación"
          value={vm.pressureValue}
          sub={vm.pressureSub}
          tone="amber"
          emphasis={vm.pressureValue > 0}
          icon={<Flame size={15} />}
        />

        <StatTile
          label="Ritmo 7d"
          value={vm.completionAverage}
          unit="%"
          sub={vm.rhythmSub}
          tone="violet"
          icon={<BarChart3 size={15} />}
        />
      </div>
    </div>
  );
}
