import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { GetCarryOverRate } from "@/core/app/tasks/GetCarryOverRate";
import { buildPlanningSignal, type PlanningTone } from "@/core/domain/tasks/PlanningSignal";
import type { PlanningSignalViewModel } from "@/ui/models/tasks/PlanningSignalViewModel";
import type { TasksDashboardStore } from "../TasksDashboardStore";

const COPY: Record<PlanningTone, { headline: string; summary: string }> = {
  error: {
    headline: "Plan cargado al limite",
    summary:
      "Conviene bajar la carga antes de seguir agregando tareas. El arrastre ya esta afectando la ejecucion.",
  },
  warning: {
    headline: "Plan con presion",
    summary: "Todavia es recuperable, pero necesitas elegir mejor que entra en foco y que no.",
  },
  success: {
    headline: "Plan liviano",
    summary: "La carga de hoy es baja. Puedes ejecutar sin entrar en modo reactivo.",
  },
  info: {
    headline: "Plan controlable",
    summary: "Hay trabajo real, pero la cola aun puede sostenerse si respetas el foco.",
  },
};

/**
 * Planning signal: reads today's shared task list, loads its own carry-over
 * rate through the Core, then projects copy and metric labels for the view.
 */
export class PlanningSignalPresenter extends PresenterBase<PlanningSignalViewModel> {
  private carryOverRate = 0;
  private isLoading = false;

  constructor(
    onChange: ChangeFunc,
    private readonly store: TasksDashboardStore,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): PlanningSignalViewModel {
    return this.buildModel();
  }

  start(): void {
    this.store.tasks$.subscribe(this, () => this.refresh());
    void this.loadCarryOverRate();
  }

  stop(): void {
    this.store.tasks$.unsubscribe(this);
  }

  private async loadCarryOverRate(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      const result = await this.core.execute(new GetCarryOverRate(7));
      this.carryOverRate = result.rate;
    } catch {
      this.carryOverRate = 0;
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): PlanningSignalViewModel {
    const signal = buildPlanningSignal({
      tasks: this.store.tasks$.value,
      carryOverRate: this.carryOverRate,
    });
    const copy = COPY[signal.tone];

    return {
      tone: signal.tone,
      toneClass: this.toneClass(signal.tone),
      eyebrow: "Plan del dia",
      headline: copy.headline,
      summary: copy.summary,
      metrics: [
        { label: "Pendientes", value: String(signal.pendingCount) },
        { label: "Calientes", value: String(signal.urgentCount) },
        { label: "Carry 7d", value: `${signal.carryOverRate}%` },
      ],
      recommendations: [
        this.focusRecommendation(signal.pendingCount, signal.focusTasks.length),
        this.carryOverRecommendation(signal.carryOverRate),
        this.pressureRecommendation(signal.stuckCount, signal.urgentCount),
      ],
      isLoading: this.isLoading,
    };
  }

  private focusRecommendation(pendingCount: number, focusCount: number): string {
    if (pendingCount === 0) {
      return "No agregues volumen artificial. Usa el chat o captura rapida solo si aparece trabajo concreto.";
    }
    const limit = Math.max(1, Math.min(3, focusCount || 3));
    return `Limita el foco a ${limit} tarea${limit === 1 ? "" : "s"} de impacto inmediato.`;
  }

  private carryOverRecommendation(carryOverRate: number): string {
    if (carryOverRate >= 35) {
      return `El carry-over de 7 dias va en ${carryOverRate}%. Prioriza cierre o descarte antes de seguir moviendo tareas.`;
    }
    return "El arrastre semanal esta bajo control. Mantener el foco hoy vale mas que replanificar de mas.";
  }

  private pressureRecommendation(stuckCount: number, urgentCount: number): string {
    if (stuckCount > 0) {
      return `${stuckCount} tarea${stuckCount === 1 ? "" : "s"} ya estan bloqueadas por carry-over. Necesitan decision explicita, no mas espera.`;
    }
    if (urgentCount > 0) {
      return `${urgentCount} tarea${urgentCount === 1 ? "" : "s"} caliente${urgentCount === 1 ? "" : "s"} merecen resolucion antes del resto.`;
    }
    return "No hay señales fuertes de atasco. Puedes sostener el plan si evitas abrir demasiados frentes.";
  }

  private toneClass(tone: PlanningTone): string {
    if (tone === "success") return "border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)]";
    if (tone === "warning") return "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)]";
    if (tone === "error") return "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)]";
    return "border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)]";
  }
}
