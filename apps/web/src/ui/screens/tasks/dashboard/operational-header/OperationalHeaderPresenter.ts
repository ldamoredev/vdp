import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import type { Task } from "@/core/domain/tasks/Task";
import { CarryOverAll } from "@/core/app/tasks/CarryOverAll";
import type { OperationalHeaderViewModel } from "@/ui/models/tasks/OperationalHeaderViewModel";
import type { TasksDashboardStore } from "../TasksDashboardStore";

/**
 * The dashboard header: today's completion, pressure (hot/stuck/high-priority
 * derived from the shared list) and the 7-day rhythm, plus reschedule-all. All
 * of its data — list, today stats and trend — comes from the shared store; it
 * loads nothing on its own.
 */
export class OperationalHeaderPresenter extends PresenterBase<OperationalHeaderViewModel> {
  private isRescheduling = false;

  constructor(
    onChange: ChangeFunc,
    private readonly store: TasksDashboardStore,
    private readonly core: Core,
    private readonly today: string,
  ) {
    super(onChange);
  }

  protected initModel(): OperationalHeaderViewModel {
    return this.buildModel();
  }

  start(): void {
    this.store.tasks$.subscribe(this, () => this.refresh());
    this.store.todayStats$.subscribe(this, () => this.refresh());
    this.store.trend$.subscribe(this, () => this.refresh());
  }

  stop(): void {
    this.store.tasks$.unsubscribe(this);
    this.store.todayStats$.unsubscribe(this);
    this.store.trend$.unsubscribe(this);
  }

  async reschedule(): Promise<void> {
    if (this.isRescheduling || this.pendingTasks().length === 0) return;
    this.isRescheduling = true;
    this.refresh();
    try {
      await this.core.execute(new CarryOverAll(this.today));
      await this.store.load();
    } finally {
      this.isRescheduling = false;
      this.refresh();
    }
  }

  private pendingTasks(): Task[] {
    return this.store.tasks$.value.filter((task) => task.isOpen);
  }

  private completionAverage(): number {
    const trend = this.store.trend$.value;
    if (trend.length === 0) return 0;
    return Math.round(trend.reduce((acc, day) => acc + day.completionRate, 0) / trend.length);
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): OperationalHeaderViewModel {
    const stats = this.store.todayStats$.value;
    const pending = this.pendingTasks();
    const done = this.store.tasks$.value.filter((task) => task.isDone);
    const urgent = pending.filter((task) => task.priority === 3 || task.carryOverCount > 0);
    const stuck = pending.filter((task) => task.isStuck);
    const highPriority = pending.filter((task) => task.priority === 3);

    return {
      completionRate: stats?.completionRate ?? 0,
      completed: stats?.completed ?? 0,
      total: stats?.total ?? 0,
      urgentCount: urgent.length,
      stuckCount: stuck.length,
      highPriorityCount: highPriority.length,
      pressureValue: stuck.length,
      pressureSub: this.pressureSub(stuck.length, highPriority.length),
      completionAverage: this.completionAverage(),
      pendingCount: pending.length,
      doneCount: done.length,
      rhythmSub: this.rhythmSub(pending.length, done.length),
      canReschedule: pending.length > 0 && !this.isRescheduling,
      isRescheduling: this.isRescheduling,
    };
  }

  private pressureSub(stuckCount: number, highPriorityCount: number): string {
    if (stuckCount === 0 && highPriorityCount === 0) return "Sin tareas calientes.";
    return `${stuckCount} trabada${stuckCount === 1 ? "" : "s"}, ${highPriorityCount} alta prioridad.`;
  }

  private rhythmSub(pendingCount: number, doneCount: number): string {
    return `${pendingCount} pendiente${pendingCount === 1 ? "" : "s"}, ${doneCount} cerrada${doneCount === 1 ? "" : "s"}.`;
  }
}
