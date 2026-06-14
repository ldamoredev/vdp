import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import type { Task } from "@/core/domain/tasks/Task";
import { CarryOverAll } from "@/core/app/tasks/CarryOverAll";
import { GetTaskTrend } from "@/core/app/tasks/GetTaskTrend";
import { GetTodayStats } from "@/core/app/tasks/GetTodayStats";
import type { OperationalHeaderViewModel } from "@/ui/models/tasks/OperationalHeaderViewModel";
import type { TasksDashboardStore } from "../TasksDashboardStore";

/**
 * The dashboard header: today's completion, pressure (hot/stuck/high-priority
 * derived from the shared list) and the 7-day rhythm, plus reschedule-all.
 * Reads the shared store for the list-derived counts and loads its own
 * stats/trend through the Core.
 */
export class OperationalHeaderPresenter extends PresenterBase<OperationalHeaderViewModel> {
  private completionRate = 0;
  private completed = 0;
  private total = 0;
  private completionAverage = 0;
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
    void this.loadStats();
    void this.loadTrend();
  }

  stop(): void {
    this.store.tasks$.unsubscribe(this);
  }

  async reschedule(): Promise<void> {
    if (this.isRescheduling || this.pendingTasks().length === 0) return;
    this.isRescheduling = true;
    this.refresh();
    try {
      await this.core.execute(new CarryOverAll(this.today));
      await Promise.all([this.store.load(), this.loadStats(), this.loadTrend()]);
    } finally {
      this.isRescheduling = false;
      this.refresh();
    }
  }

  private async loadStats(): Promise<void> {
    try {
      const stats = await this.core.execute(new GetTodayStats());
      this.completionRate = stats.completionRate;
      this.completed = stats.completed;
      this.total = stats.total;
    } catch {
      // stats are non-critical chrome; leave the last known values
    } finally {
      this.refresh();
    }
  }

  private async loadTrend(): Promise<void> {
    try {
      const trend = await this.core.execute(new GetTaskTrend(7));
      this.completionAverage = trend.length
        ? Math.round(trend.reduce((acc, day) => acc + day.completionRate, 0) / trend.length)
        : 0;
    } catch {
      // non-critical
    } finally {
      this.refresh();
    }
  }

  private pendingTasks(): Task[] {
    return this.store.tasks$.value.filter((task) => task.isPending);
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): OperationalHeaderViewModel {
    const pending = this.pendingTasks();
    const done = this.store.tasks$.value.filter((task) => task.isDone);
    const urgent = pending.filter((task) => task.priority === 3 || task.carryOverCount > 0);
    const stuck = pending.filter((task) => task.isStuck);
    const highPriority = pending.filter((task) => task.priority === 3);

    return {
      completionRate: this.completionRate,
      completed: this.completed,
      total: this.total,
      urgentCount: urgent.length,
      stuckCount: stuck.length,
      highPriorityCount: highPriority.length,
      completionAverage: this.completionAverage,
      pendingCount: pending.length,
      doneCount: done.length,
      canReschedule: pending.length > 0 && !this.isRescheduling,
      isRescheduling: this.isRescheduling,
    };
  }
}
