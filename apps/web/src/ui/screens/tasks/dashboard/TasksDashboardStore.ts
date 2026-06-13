import { observableValue, type MutableObservableValue, type ObservableValue } from "@nbottarini/observable";

import type { Core } from "@/core/Core";
import { ListTasks } from "@/core/app/tasks/ListTasks";
import { sortExecutionQueue, type Task, type TaskFilter } from "@/core/domain/tasks/Task";
import type { TasksEvents } from "@/ui/events/TasksEvents";

/**
 * The dashboard's shared state: today's task list, the active filter and the
 * selected task. Multiple section presenters read and mutate this in common
 * (what React Query's cache used to hold), so it lives in one React-free store
 * exposed as observables. Stats/trend/review are NOT here — each section loads
 * its own read-only derivatives through the Core.
 */
export class TasksDashboardStore {
  private readonly _tasks: MutableObservableValue<Task[]> = observableValue<Task[]>([]);
  private readonly _filter: MutableObservableValue<TaskFilter> = observableValue<TaskFilter>("focus");
  private readonly _selectedId: MutableObservableValue<string | undefined> =
    observableValue<string | undefined>(undefined);
  private readonly _isLoading: MutableObservableValue<boolean> = observableValue<boolean>(true);
  private readonly _error: MutableObservableValue<boolean> = observableValue<boolean>(false);

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

  /** Subscribe to cross-module task mutations (chat-sync). Returns an unsubscribe. */
  start(): () => void {
    this.events.tasksChanged.subscribe(this, () => void this.load());
    void this.load();
    return () => this.events.tasksChanged.unsubscribe(this);
  }

  async load(): Promise<void> {
    this._isLoading.value = true;
    try {
      const { tasks } = await this.core.execute(new ListTasks({ scheduledDate: this.today }));
      this._tasks.value = sortExecutionQueue(tasks);
      this._error.value = false;
    } catch {
      this._error.value = true;
    } finally {
      this._isLoading.value = false;
    }
  }

  setFilter(filter: TaskFilter): void {
    this._filter.value = filter;
  }

  select(taskId: string | undefined): void {
    this._selectedId.value = taskId;
  }
}
