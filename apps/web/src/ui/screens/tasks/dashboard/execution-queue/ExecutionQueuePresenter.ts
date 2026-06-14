import type { Request } from "@nbottarini/cqbus";
import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { filterTasks, type Task, type TaskFilter } from "@/core/domain/tasks/Task";
import { CompleteTask } from "@/core/app/tasks/CompleteTask";
import { CarryOverTask } from "@/core/app/tasks/CarryOverTask";
import { DiscardTask } from "@/core/app/tasks/DiscardTask";
import { DeleteTask } from "@/core/app/tasks/DeleteTask";
import type {
  ExecutionQueueViewModel,
  FilterOptionVM,
  TaskRowVM,
} from "@/ui/models/tasks/ExecutionQueueViewModel";
import type { TasksDashboardStore } from "../TasksDashboardStore";

const FILTER_LABELS: Record<TaskFilter, string> = {
  focus: "Focus",
  pending: "Pendientes",
  done: "Hechas",
  all: "Todas",
};

/**
 * The execution queue: today's filtered task list with complete/carry-over/
 * discard/delete actions and selection. Reads the shared dashboard store
 * (list/filter/selection) and dispatches commands through the Core, reloading
 * the store after each mutation. expandedActionsId is local UI state.
 */
export class ExecutionQueuePresenter extends PresenterBase<ExecutionQueueViewModel> {
  private busyIds = new Set<string>();
  private expandedActionsId: string | null = null;

  constructor(
    onChange: ChangeFunc,
    private readonly store: TasksDashboardStore,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): ExecutionQueueViewModel {
    return this.buildModel();
  }

  start(): void {
    this.store.tasks$.subscribe(this, () => this.refresh());
    this.store.filter$.subscribe(this, () => this.refresh());
    this.store.isLoading$.subscribe(this, () => this.refresh());
    this.store.error$.subscribe(this, () => this.refresh());
  }

  stop(): void {
    this.store.tasks$.unsubscribe(this);
    this.store.filter$.unsubscribe(this);
    this.store.isLoading$.unsubscribe(this);
    this.store.error$.unsubscribe(this);
  }

  setFilter(filter: TaskFilter): void {
    this.store.setFilter(filter);
  }

  openDetail(id: string): void {
    this.store.select(id);
    this.setExpandedActions(null);
  }

  setExpandedActions(id: string | null): void {
    this.expandedActionsId = id;
    this.refresh();
  }

  complete(id: string): Promise<void> {
    return this.runForId(id, new CompleteTask(id));
  }

  carryOver(id: string): Promise<void> {
    return this.runForId(id, new CarryOverTask(id));
  }

  discard(id: string): Promise<void> {
    return this.runForId(id, new DiscardTask(id));
  }

  delete(id: string): Promise<void> {
    return this.runForId(id, new DeleteTask(id));
  }

  private async runForId(id: string, command: Request<unknown>): Promise<void> {
    this.busyIds.add(id);
    this.refresh();
    try {
      await this.core.execute(command);
      await this.store.load();
    } finally {
      this.busyIds.delete(id);
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): ExecutionQueueViewModel {
    const tasks = this.store.tasks$.value;
    const filter = this.store.filter$.value;
    return {
      filter,
      filterOptions: this.filterOptions(tasks),
      rows: filterTasks(tasks, filter).map((task) => this.rowVM(task)),
      isLoading: this.store.isLoading$.value,
      error: this.store.error$.value,
    };
  }

  private filterOptions(tasks: readonly Task[]): FilterOptionVM[] {
    const pending = tasks.filter((task) => task.isPending).length;
    const done = tasks.filter((task) => task.isDone).length;
    const focus = filterTasks(tasks, "focus").length;
    return [
      { key: "focus", label: FILTER_LABELS.focus, count: focus },
      { key: "pending", label: FILTER_LABELS.pending, count: pending },
      { key: "done", label: FILTER_LABELS.done, count: done },
      { key: "all", label: FILTER_LABELS.all, count: tasks.length },
    ];
  }

  private rowVM(task: Task): TaskRowVM {
    return {
      id: task.id,
      title: task.title,
      done: task.isDone,
      toneClass: this.toneClass(task),
      priority: task.priority,
      domain: task.domain,
      carryOverCount: task.carryOverCount,
      busy: this.busyIds.has(task.id),
      actionsOpen: this.expandedActionsId === task.id,
    };
  }

  private toneClass(task: Task): string {
    if (task.isDone) return "border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)]";
    if (task.carryOverCount >= 3) return "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)]";
    if (task.carryOverCount > 0 || task.priority === 3) {
      return "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)]";
    }
    return "border-[var(--glass-border)] bg-[var(--hover-overlay)]";
  }
}
