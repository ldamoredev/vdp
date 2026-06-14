import type { TaskStats, TaskTrendDay } from "@vdp/shared";
import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { GetTaskTrend } from "@/core/app/tasks/GetTaskTrend";
import { GetTodayStats } from "@/core/app/tasks/GetTodayStats";
import { filterTasks, type Task } from "@/core/domain/tasks/Task";
import type {
  NextBestActionTaskVM,
  RecoveryMetricVM,
  SidebarCardsViewModel,
  WeeklyRhythmDayVM,
} from "@/ui/models/tasks/SidebarCardsViewModel";
import type { TasksDashboardStore } from "../TasksDashboardStore";

/**
 * Sidebar cards: a compact dashboard strip for the next best action, recovery
 * pressure, and weekly rhythm. Reads list/filter from the shared store and
 * loads stats/trend directly through the Core.
 */
export class SidebarCardsPresenter extends PresenterBase<SidebarCardsViewModel> {
  private stats: TaskStats | null = null;
  private trend: TaskTrendDay[] = [];

  constructor(
    onChange: ChangeFunc,
    private readonly store: TasksDashboardStore,
    private readonly core: Core,
    private readonly today: string,
  ) {
    super(onChange);
  }

  protected initModel(): SidebarCardsViewModel {
    return this.buildModel();
  }

  start(): void {
    this.store.tasks$.subscribe(this, () => this.refresh());
    this.store.filter$.subscribe(this, () => this.refresh());
    void this.loadStats();
    void this.loadTrend();
  }

  stop(): void {
    this.store.tasks$.unsubscribe(this);
    this.store.filter$.unsubscribe(this);
  }

  private async loadStats(): Promise<void> {
    try {
      this.stats = await this.core.execute(new GetTodayStats());
    } catch {
      this.stats = null;
    } finally {
      this.refresh();
    }
  }

  private async loadTrend(): Promise<void> {
    try {
      this.trend = await this.core.execute(new GetTaskTrend(7));
    } catch {
      this.trend = [];
    } finally {
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): SidebarCardsViewModel {
    return {
      nextBestAction: {
        title: "Siguiente mejor accion",
        task: this.nextBestActionTaskVM(),
        emptyText: this.store.tasks$.value.length === 0 ? "No hay tareas cargadas para hoy." : null,
      },
      recovery: {
        title: "Tablero de recuperacion",
        metrics: this.recoveryMetrics(),
      },
      weeklyRhythm: {
        title: "Ritmo semanal",
        days: this.weeklyRhythmDays(),
        emptyText: this.trend.length === 0 ? "Todavia no hay tendencia suficiente." : null,
      },
    };
  }

  private nextBestActionTaskVM(): NextBestActionTaskVM | null {
    const tasks = this.store.tasks$.value;
    const visibleTasks = filterTasks(tasks, this.store.filter$.value);
    const pendingTasks = tasks.filter((task) => task.isPending);
    const task = visibleTasks[0] ?? pendingTasks[0];
    if (!task) return null;
    return {
      id: task.id,
      eyebrow: "En foco",
      title: task.title,
      priority: task.priority,
      domain: task.domain,
      reason: this.nextBestActionReason(task),
    };
  }

  private nextBestActionReason(task: Task): string {
    if (task.isDone) return "La cola visible ya tiene trabajo cerrado.";
    if (task.carryOverCount > 0) {
      return "Conviene resolverla o descartarla antes de sumar mas friccion.";
    }
    return "Es la pieza con mayor impacto inmediato segun prioridad y arrastre.";
  }

  private recoveryMetrics(): RecoveryMetricVM[] {
    const pendingTasks = this.store.tasks$.value.filter((task) => task.isPending);
    const pendingCount = this.stats?.pending ?? pendingTasks.length;
    const carryOverCount = pendingTasks.filter((task) => task.carryOverCount > 0).length;
    const stuckCount = pendingTasks.filter((task) => task.isStuck).length;

    return [
      {
        label: "Pendientes",
        value: String(pendingCount),
        className: "border-[var(--glass-border)] bg-[var(--hover-overlay)]",
      },
      {
        label: "Con carry-over",
        value: String(carryOverCount),
        className: "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)]",
      },
      {
        label: "Bloqueadas",
        value: String(stuckCount),
        className: "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)]",
      },
    ];
  }

  private weeklyRhythmDays(): WeeklyRhythmDayVM[] {
    return this.trend
      .slice()
      .reverse()
      .map((day) => ({
        date: day.date,
        dateLabel: day.date.slice(5),
        completionRateLabel: `${day.completionRate}%`,
        heightPercent: Math.max(6, day.completionRate),
        today: day.date === this.today,
        barClassName:
          day.date === this.today
            ? "bg-gradient-to-t from-[var(--accent-secondary)] to-[var(--accent)]"
            : "bg-gradient-to-t from-[var(--violet-soft-bg)] to-[var(--violet-soft-border)]",
      }));
  }
}
