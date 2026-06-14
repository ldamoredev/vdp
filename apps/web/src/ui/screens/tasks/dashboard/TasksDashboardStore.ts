import { observableValue, type MutableObservableValue, type ObservableValue } from "@nbottarini/observable";
import type { TaskStats, TaskTrendDay } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { GetCarryOverRate } from "@/core/app/tasks/GetCarryOverRate";
import { GetTaskTrend } from "@/core/app/tasks/GetTaskTrend";
import { GetTodayStats } from "@/core/app/tasks/GetTodayStats";
import { ListTasks } from "@/core/app/tasks/ListTasks";
import { sortExecutionQueue, type Task, type TaskFilter } from "@/core/domain/tasks/Task";
import type { TasksEvents } from "@/ui/events/TasksEvents";

const TREND_DAYS = 7;

/**
 * The dashboard's shared state: today's task list, filter, selection, and the
 * read-only derivatives (today stats, 7d trend, carry-over rate) that several
 * sections render. All of it lives here — what React Query's cache used to hold
 * and dedupe — so a single load() refreshes everything once instead of each
 * section fetching the same stats/trend. React-free, exposed as observables.
 * The list is critical (sets the error flag on failure); the derivatives are
 * chrome and degrade quietly to their last known / default values.
 */
export class TasksDashboardStore {
  private readonly _tasks: MutableObservableValue<Task[]> = observableValue<Task[]>([]);
  private readonly _filter: MutableObservableValue<TaskFilter> = observableValue<TaskFilter>("focus");
  private readonly _selectedId: MutableObservableValue<string | undefined> =
    observableValue<string | undefined>(undefined);
  private readonly _isLoading: MutableObservableValue<boolean> = observableValue<boolean>(true);
  private readonly _error: MutableObservableValue<boolean> = observableValue<boolean>(false);
  private readonly _todayStats: MutableObservableValue<TaskStats | null> =
    observableValue<TaskStats | null>(null);
  private readonly _trend: MutableObservableValue<TaskTrendDay[]> = observableValue<TaskTrendDay[]>([]);
  private readonly _carryOverRate: MutableObservableValue<number> = observableValue<number>(0);

  constructor(
    private readonly core: Core,
    private readonly events: TasksEvents,
    private readonly today: string,
  ) {}

  get tasks$(): ObservableValue<Task[]> {
    return this._tasks;
  }
  get filter$(): ObservableValue<TaskFilter> {
    return this._filter;
  }
  get selectedId$(): ObservableValue<string | undefined> {
    return this._selectedId;
  }
  get isLoading$(): ObservableValue<boolean> {
    return this._isLoading;
  }
  get error$(): ObservableValue<boolean> {
    return this._error;
  }
  get todayStats$(): ObservableValue<TaskStats | null> {
    return this._todayStats;
  }
  get trend$(): ObservableValue<TaskTrendDay[]> {
    return this._trend;
  }
  get carryOverRate$(): ObservableValue<number> {
    return this._carryOverRate;
  }

  /** Subscribe to cross-module task mutations (chat-sync). Returns an unsubscribe. */
  start(): () => void {
    this.events.tasksChanged.subscribe(this, () => void this.load());
    void this.load();
    return () => this.events.tasksChanged.unsubscribe(this);
  }

  async load(): Promise<void> {
    this._isLoading.value = true;
    await Promise.all([this.loadTasks(), this.loadStats(), this.loadTrend(), this.loadCarryOverRate()]);
    this._isLoading.value = false;
  }

  private async loadTasks(): Promise<void> {
    try {
      const { tasks } = await this.core.execute(new ListTasks({ scheduledDate: this.today }));
      this._tasks.value = sortExecutionQueue(tasks);
      this._error.value = false;
    } catch {
      this._error.value = true;
    }
  }

  private async loadStats(): Promise<void> {
    try {
      this._todayStats.value = await this.core.execute(new GetTodayStats());
    } catch {
      // derivative chrome: keep last known value
    }
  }

  private async loadTrend(): Promise<void> {
    try {
      this._trend.value = await this.core.execute(new GetTaskTrend(TREND_DAYS));
    } catch {
      // keep last known value
    }
  }

  private async loadCarryOverRate(): Promise<void> {
    try {
      const result = await this.core.execute(new GetCarryOverRate(TREND_DAYS));
      this._carryOverRate.value = result.rate;
    } catch {
      // keep last known value
    }
  }

  setFilter(filter: TaskFilter): void {
    this._filter.value = filter;
  }

  select(taskId: string | undefined): void {
    this._selectedId.value = taskId;
  }
}
