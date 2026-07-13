import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { TaskBoardStatus } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { AssignTaskToProject } from "@/core/app/projects/AssignTaskToProject";
import { GetProject } from "@/core/app/projects/GetProject";
import { ListTasks } from "@/core/app/tasks/ListTasks";
import type { Project } from "@/core/domain/projects/Project";
import { sortExecutionQueue, type Task } from "@/core/domain/tasks/Task";
import { chatStore } from "@/lib/chat-store";
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

export interface ProjectChatOpener {
  openProjectBreakdown(project: Project): void;
  openProjectReview(project: Project): void;
}

const defaultProjectChatOpener: ProjectChatOpener = {
  openProjectBreakdown: (project) => {
    chatStore.openWithLaunchRequest({
      domainKey: "tasks",
      newConversation: true,
      starterMessage: buildProjectBreakdownStarterMessage(project),
    });
  },
  openProjectReview: (project) => {
    chatStore.openWithLaunchRequest({
      domainKey: "projects",
      newConversation: true,
      starterMessage: buildProjectReviewStarterMessage(project),
    });
  },
};

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
    private readonly chatOpener: ProjectChatOpener = defaultProjectChatOpener,
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

  startBreakdownChat(): void {
    if (!this.project) return;
    this.chatOpener.openProjectBreakdown(this.project);
  }

  startProjectReviewChat(): void {
    if (!this.project) return;
    this.chatOpener.openProjectReview(this.project);
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
      breakdownAction: {
        label: "Desglosar en tareas (IA)",
        isDisabled: !this.project,
      },
      reviewAction: {
        label: "Revisar proyecto (IA)",
        isDisabled: !this.project,
      },
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

function buildProjectBreakdownStarterMessage(project: Project): string {
  return [
    "Quiero desglosar este proyecto en tareas concretas para el board.",
    `projectId: "${project.id}"`,
    `Outcome: ${project.outcome}`,
    `Proxima accion: ${project.nextAction}`,
    `Foco: ${project.focus}`,
    "Usa get_project_context con ese projectId para revisar el proyecto y las tareas existentes.",
    "Proponeme 3 a 8 tareas para backlog y espera mi confirmacion antes de crear nada.",
  ].join("\n");
}

function buildProjectReviewStarterMessage(project: Project): string {
  return [
    "Revisa este proyecto con evidencia real y ayudame a llegar a una decision util.",
    `projectId: "${project.id}"`,
    `Outcome: ${project.outcome}`,
    `Proxima accion: ${project.nextAction}`,
    `Foco: ${project.focus}`,
    "Usa get_project_board para contrastar la direccion con las tareas existentes.",
    "Si el tiempo registrado aporta evidencia, consulta el periodo relevante antes de concluir.",
    "Responde breve: estado, señal principal y una decision util. No escribas ni muevas datos.",
  ].join("\n");
}
