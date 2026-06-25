import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { TaskBoardStatus } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { AssignTaskToProject } from "@/core/app/projects/AssignTaskToProject";
import { GetProject } from "@/core/app/projects/GetProject";
import { ListTasks } from "@/core/app/tasks/ListTasks";
import type { Project } from "@/core/domain/projects/Project";
import { sortExecutionQueue, type Task } from "@/core/domain/tasks/Task";
import type {
  ProjectBoardColumnId,
  ProjectBoardViewModel,
} from "@/ui/models/projects/ProjectBoardViewModel";

const COLUMNS: readonly { id: ProjectBoardColumnId; title: string; emptyText: string }[] = [
  { id: "backlog", title: "Backlog", emptyText: "Sin tareas asociadas todavía." },
  { id: "next", title: "Próximo", emptyText: "Nada marcado como siguiente acción." },
  { id: "doing", title: "En foco", emptyText: "Nada en foco ahora." },
  { id: "done", title: "Hecho", emptyText: "Todavía no hay tareas cerradas en este proyecto." },
];

export class ProjectBoardPresenter extends PresenterBase<ProjectBoardViewModel> {
  private project: Project | null = null;
  private tasks: Task[] = [];
  private busyTaskIds = new Set<string>();
  private isLoading = true;
  private error: string | null = null;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
    private readonly projectId: string | null,
  ) {
    super(onChange);
  }

  protected initModel(): ProjectBoardViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
  }

  reload(): Promise<void> {
    return this.load();
  }

  moveTask(taskId: string, boardStatus: TaskBoardStatus | null): Promise<void> {
    if (!this.projectId || this.busyTaskIds.has(taskId)) return Promise.resolve();
    this.busyTaskIds.add(taskId);
    this.refresh();
    return this.core
      .execute(new AssignTaskToProject(this.projectId, { taskId, boardStatus }))
      .then(() => this.load())
      .finally(() => {
        this.busyTaskIds.delete(taskId);
        this.refresh();
      });
  }

  private async load(): Promise<void> {
    if (!this.projectId) {
      this.project = null;
      this.tasks = [];
      this.isLoading = false;
      this.refresh();
      return;
    }
    this.isLoading = true;
    this.refresh();
    try {
      const [project, list] = await Promise.all([
        this.core.execute(new GetProject(this.projectId)),
        this.core.execute(new ListTasks({ projectId: this.projectId, limit: "200" })),
      ]);
      this.project = project;
      this.tasks = list.tasks;
      this.error = null;
    } catch {
      this.error = "No pudimos cargar el tablero del proyecto.";
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): ProjectBoardViewModel {
    return {
      projectId: this.projectId,
      title: this.project?.outcome ?? "Elegí un proyecto",
      subtitle: this.project
        ? `${this.project.focus} · Próximo: ${this.project.nextAction}`
        : "Seleccioná un proyecto para ver su board.",
      isLoading: this.isLoading,
      error: this.error,
      columns: COLUMNS.map((column) => {
        const tasks = sortExecutionQueue(this.tasks.filter((task) => task.boardStatus === column.id));
        return {
          id: column.id,
          title: column.title,
          count: tasks.length,
          emptyText: column.emptyText,
          tasks: tasks.map((task) => ({
            id: task.id,
            title: task.title,
            priorityLabel: `P${task.priority}`,
            statusLabel: statusLabel(task.status),
            isBusy: this.busyTaskIds.has(task.id),
          })),
        };
      }),
    };
  }
}

function statusLabel(status: Task["status"]): string {
  if (status === "pending") return "Pendiente";
  if (status === "in_progress") return "En progreso";
  if (status === "done") return "Hecha";
  return "Descartada";
}
