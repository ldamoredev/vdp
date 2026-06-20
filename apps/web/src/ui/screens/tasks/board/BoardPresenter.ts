import type { Request } from "@nbottarini/cqbus";
import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { CarryOverTask } from "@/core/app/tasks/CarryOverTask";
import { CompleteTask } from "@/core/app/tasks/CompleteTask";
import { CreateTask } from "@/core/app/tasks/CreateTask";
import { DiscardTask } from "@/core/app/tasks/DiscardTask";
import { ListTasks } from "@/core/app/tasks/ListTasks";
import { sortExecutionQueue, type Task } from "@/core/domain/tasks/Task";
import { domainLabel, formatTaskDate } from "@/lib/format";
import type { TasksEvents } from "@/ui/events/TasksEvents";
import type {
  BoardColumnTone,
  BoardColumnVM,
  BoardScope,
  BoardTaskState,
  BoardTaskVM,
  BoardViewModel,
} from "@/ui/models/tasks/BoardViewModel";

const COLUMN_ORDER: readonly BoardTaskState[] = ["pending", "done", "discarded"];

const COLUMN_META: Record<BoardTaskState, { title: string; tone: BoardColumnTone; empty: string }> = {
  pending: { title: "Pendientes", tone: "accent", empty: "Nada pendiente acá." },
  done: { title: "Hechas", tone: "green", empty: "Sin tareas cerradas todavía." },
  discarded: { title: "Descartadas", tone: "muted", empty: "Nada descartado." },
};

const DEFAULT_PRIORITY = 2;

interface ComposerState {
  title: string;
  priority: number;
  busy: boolean;
}

/**
 * The per-module task board: the tasks whose `domain` is this module, grouped
 * into pending/done/discarded columns. Reads through `ListTasks({ domain })`,
 * dispatches the existing transition/create commands, and reloads after each
 * mutation. The column → status mapping (incl. drag-drop) and the "trabada"
 * rule live here so the BoardSection view stays humble. Refreshes on the
 * app-wide TasksEvents (chat-sync / agent mutations), like the dashboard.
 */
export class BoardPresenter extends PresenterBase<BoardViewModel> {
  private tasks: Task[] = [];
  private scope: BoardScope = "all";
  private readonly busyIds = new Set<string>();
  private draggingId: string | null = null;
  private dropTargetId: BoardTaskState | null = null;
  private composer: ComposerState | null = null;
  private isLoading = true;
  private error = false;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
    private readonly events: TasksEvents,
    private readonly domain: string,
  ) {
    super(onChange);
  }

  protected initModel(): BoardViewModel {
    return this.buildModel();
  }

  start(): void {
    this.events.tasksChanged.unsubscribe(this);
    this.events.tasksChanged.subscribe(this, () => void this.load());
    void this.load();
  }

  stop(): void {
    this.events.tasksChanged.unsubscribe(this);
  }

  reload(): Promise<void> {
    return this.load();
  }

  setScope(scope: BoardScope): void {
    if (this.scope === scope) return;
    this.scope = scope;
    this.refresh();
  }

  // ── Drag & drop ─────────────────────────────────────────
  startDrag(id: string): void {
    this.draggingId = id;
    this.refresh();
  }

  endDrag(): void {
    this.draggingId = null;
    this.dropTargetId = null;
    this.refresh();
  }

  setDropTarget(column: BoardTaskState | null): void {
    if (this.dropTargetId === column) return;
    this.dropTargetId = column;
    this.refresh();
  }

  /** Maps the destination column to a status transition. Reopening (back to
   *  pending) is intentionally unsupported by the current Task model. */
  drop(column: BoardTaskState): void {
    const id = this.draggingId;
    this.draggingId = null;
    this.dropTargetId = null;
    const task = id ? this.tasks.find((candidate) => candidate.id === id) : undefined;
    if (!task || task.status === column) {
      this.refresh();
      return;
    }
    if (column === "done") {
      void this.runForId(task.id, new CompleteTask(task.id));
      return;
    }
    if (column === "discarded") {
      void this.runForId(task.id, new DiscardTask(task.id));
      return;
    }
    this.refresh();
  }

  // ── Quick actions ───────────────────────────────────────
  complete(id: string): Promise<void> {
    return this.runForId(id, new CompleteTask(id));
  }

  carryOver(id: string): Promise<void> {
    return this.runForId(id, new CarryOverTask(id));
  }

  discard(id: string): Promise<void> {
    return this.runForId(id, new DiscardTask(id));
  }

  // ── Inline create (composer) ────────────────────────────
  openComposer(): void {
    this.composer = { title: "", priority: DEFAULT_PRIORITY, busy: false };
    this.refresh();
  }

  closeComposer(): void {
    this.composer = null;
    this.refresh();
  }

  setComposerTitle(title: string): void {
    if (!this.composer) return;
    this.composer.title = title;
    this.refresh();
  }

  setComposerPriority(priority: number): void {
    if (!this.composer) return;
    this.composer.priority = priority;
    this.refresh();
  }

  async submitComposer(): Promise<void> {
    if (!this.composer) return;
    const title = this.composer.title.trim();
    if (!title || this.composer.busy) return;
    this.composer.busy = true;
    this.refresh();
    try {
      await this.core.execute(
        new CreateTask({ title, priority: this.composer.priority, domain: this.domain }),
      );
      this.composer = null;
      await this.load();
    } catch {
      if (this.composer) this.composer.busy = false;
      this.refresh();
    }
  }

  private async runForId(id: string, command: Request<unknown>): Promise<void> {
    this.busyIds.add(id);
    this.refresh();
    try {
      await this.core.execute(command);
      await this.load();
    } finally {
      this.busyIds.delete(id);
      this.refresh();
    }
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      const { tasks } = await this.core.execute(new ListTasks({ domain: this.domain }));
      this.tasks = tasks;
      this.error = false;
    } catch {
      this.error = true;
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): BoardViewModel {
    const visible = this.scope === "active" ? (["pending"] as BoardTaskState[]) : COLUMN_ORDER;
    return {
      domainLabel: domainLabel(this.domain),
      scope: this.scope,
      columns: visible.map((status) => this.columnVM(status)),
      draggingId: this.draggingId,
      isLoading: this.isLoading,
      error: this.error,
      composer: this.composer
        ? {
            title: this.composer.title,
            priority: this.composer.priority,
            busy: this.composer.busy,
            canSubmit: this.composer.title.trim().length > 0 && !this.composer.busy,
          }
        : null,
    };
  }

  private columnVM(status: BoardTaskState): BoardColumnVM {
    const meta = COLUMN_META[status];
    const tasks = sortExecutionQueue(this.tasks.filter((task) => task.status === status)).map((task) =>
      this.taskVM(task),
    );
    return {
      id: status,
      title: meta.title,
      tone: meta.tone,
      count: tasks.length,
      canCreate: status === "pending",
      isDropTarget: this.dropTargetId === status,
      emptyText: meta.empty,
      tasks,
    };
  }

  private taskVM(task: Task): BoardTaskVM {
    return {
      id: task.id,
      title: task.title,
      priority: task.priority,
      domain: task.domain,
      carryOverCount: task.carryOverCount,
      dateLabel: formatTaskDate(task.scheduledDate),
      state: task.status,
      isStuck: task.isStuck && task.isPending,
      busy: this.busyIds.has(task.id),
    };
  }
}
