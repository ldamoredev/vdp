import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import { buildPlanningSignal } from "@/core/domain/tasks/PlanningSignal";
import type { Task } from "@/core/domain/tasks/Task";
import type {
  FocusRecommendationItemVM,
  FocusRecommendationViewModel,
} from "@/ui/models/tasks/FocusRecommendationViewModel";
import type { TasksDashboardStore } from "../TasksDashboardStore";

const EMPTY_STATE = {
  title: "No hay foco forzado para hoy.",
  description: "La cola esta liviana. Puedes capturar trabajo nuevo sin romper el plan.",
};

/**
 * Focus recommendation: projects the top planning focus tasks and coordinates
 * selection through the shared dashboard store.
 */
export class FocusRecommendationPresenter extends PresenterBase<FocusRecommendationViewModel> {
  constructor(
    onChange: ChangeFunc,
    private readonly store: TasksDashboardStore,
  ) {
    super(onChange);
  }

  protected initModel(): FocusRecommendationViewModel {
    return this.buildModel();
  }

  start(): void {
    this.store.tasks$.subscribe(this, () => this.refresh());
    this.store.selectedId$.subscribe(this, () => this.refresh());
  }

  stop(): void {
    this.store.tasks$.unsubscribe(this);
    this.store.selectedId$.unsubscribe(this);
  }

  openFocus(id: string): void {
    this.store.select(id);
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): FocusRecommendationViewModel {
    const focusTasks = buildPlanningSignal({ tasks: this.store.tasks$.value }).focusTasks;

    return {
      title: "Focus recomendado",
      items: focusTasks.map((task, index) => this.itemVM(task, index)),
      emptyState: focusTasks.length === 0 ? EMPTY_STATE : null,
    };
  }

  private itemVM(task: Task, index: number): FocusRecommendationItemVM {
    const selected = task.id === this.store.selectedId$.value;
    return {
      id: task.id,
      rank: String(index + 1),
      title: task.title,
      priority: task.priority,
      domain: task.domain,
      carryOverCount: task.carryOverCount,
      reason: this.reason(task),
      selected,
      className: selected
        ? "border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)]"
        : "border-[var(--glass-border)] bg-[var(--hover-overlay)]",
    };
  }

  private reason(task: Task): string {
    if (task.carryOverCount > 0) {
      return `Arrastra ${task.carryOverCount} carry-over. Conviene resolverla temprano.`;
    }
    return "Tiene el mejor balance entre prioridad y urgencia para entrar en foco hoy.";
  }
}
