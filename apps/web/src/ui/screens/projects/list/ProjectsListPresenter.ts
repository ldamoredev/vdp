import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { CreateProject } from "@/core/app/projects/CreateProject";
import { ListProjects } from "@/core/app/projects/ListProjects";
import { sortProjects, type Project } from "@/core/domain/projects/Project";
import type { ProjectsListViewModel } from "@/ui/models/projects/ProjectsListViewModel";

type ProjectFormState = {
  kind: "work" | "personal";
  outcome: string;
  nextAction: string;
  focus: string;
  client: string;
  isOpen: boolean;
  isSaving: boolean;
};

export class ProjectsListPresenter extends PresenterBase<ProjectsListViewModel> {
  private projects: Project[] = [];
  private selectedProjectId: string | null = null;
  private isLoading = true;
  private error: string | null = null;
  private form: ProjectFormState = {
    kind: "work" as const,
    outcome: "",
    nextAction: "",
    focus: "",
    client: "",
    isOpen: false,
    isSaving: false,
  };

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): ProjectsListViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
  }

  selectProject(id: string): void {
    if (this.selectedProjectId === id) return;
    this.selectedProjectId = id;
    this.refresh();
  }

  openForm(): void {
    this.form.isOpen = true;
    this.refresh();
  }

  closeForm(): void {
    this.form.isOpen = false;
    this.refresh();
  }

  setKind(kind: "work" | "personal"): void {
    this.form.kind = kind;
    this.refresh();
  }

  setOutcome(outcome: string): void {
    this.form.outcome = outcome;
    this.refresh();
  }

  setNextAction(nextAction: string): void {
    this.form.nextAction = nextAction;
    this.refresh();
  }

  setFocus(focus: string): void {
    this.form.focus = focus;
    this.refresh();
  }

  setClient(client: string): void {
    this.form.client = client;
    this.refresh();
  }

  async createProject(): Promise<void> {
    if (!this.canSubmit() || this.form.isSaving) return;
    this.form.isSaving = true;
    this.refresh();
    try {
      const project = await this.core.execute(new CreateProject({
        kind: this.form.kind,
        outcome: this.form.outcome.trim(),
        nextAction: this.form.nextAction.trim(),
        focus: this.form.focus.trim(),
        client: this.form.client.trim() || null,
      }));
      this.selectedProjectId = project.id;
      this.form = {
        kind: "work",
        outcome: "",
        nextAction: "",
        focus: "",
        client: "",
        isOpen: false,
        isSaving: false,
      };
      await this.load();
    } catch {
      this.error = "No pudimos crear el proyecto.";
      this.form.isSaving = false;
      this.refresh();
    }
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      this.projects = sortProjects(await this.core.execute(new ListProjects()));
      if (!this.selectedProjectId || !this.projects.some((project) => project.id === this.selectedProjectId)) {
        this.selectedProjectId = this.projects[0]?.id ?? null;
      }
      this.error = null;
    } catch {
      this.error = "No pudimos cargar tus proyectos.";
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private canSubmit(): boolean {
    return (
      this.form.outcome.trim().length > 0 &&
      this.form.nextAction.trim().length > 0 &&
      this.form.focus.trim().length > 0
    );
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): ProjectsListViewModel {
    return {
      isLoading: this.isLoading,
      error: this.error,
      selectedProjectId: this.selectedProjectId,
      projects: this.projects.map((project) => ({
        id: project.id,
        outcome: project.outcome,
        nextAction: project.nextAction,
        focus: project.focus,
        kindLabel: project.kind === "work" ? "Trabajo" : "Personal",
        clientLabel: project.client,
        statusLabel: project.status === "active" ? "Activo" : "Archivado",
        isSelected: project.id === this.selectedProjectId,
      })),
      form: {
        ...this.form,
        canSubmit: this.canSubmit() && !this.form.isSaving,
      },
    };
  }
}
