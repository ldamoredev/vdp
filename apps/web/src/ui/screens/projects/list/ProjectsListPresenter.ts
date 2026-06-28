import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { CreateProject } from "@/core/app/projects/CreateProject";
import { ListClients } from "@/core/app/projects/ListClients";
import { ListProjects } from "@/core/app/projects/ListProjects";
import { sortClients, type Client } from "@/core/domain/projects/Client";
import { sortProjects, type Project } from "@/core/domain/projects/Project";
import type { ProjectsListViewModel } from "@/ui/models/projects/ProjectsListViewModel";

type ProjectFormState = {
  kind: "work" | "personal";
  outcome: string;
  nextAction: string;
  focus: string;
  clientId: string;
  hourlyRate: string;
  rateCurrency: "ARS" | "USD";
  isOpen: boolean;
  isSaving: boolean;
};

export class ProjectsListPresenter extends PresenterBase<ProjectsListViewModel> {
  private projects: Project[] = [];
  private clients: Client[] = [];
  private selectedProjectId: string | null = null;
  private isLoading = true;
  private error: string | null = null;
  private form: ProjectFormState = {
    kind: "work" as const,
    outcome: "",
    nextAction: "",
    focus: "",
    clientId: "",
    hourlyRate: "",
    rateCurrency: "ARS",
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
    // Refresh the client catalog so the selector reflects clients added meanwhile.
    void this.loadClients();
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

  setClientId(clientId: string): void {
    this.form.clientId = clientId;
    this.refresh();
  }

  setHourlyRate(hourlyRate: string): void {
    this.form.hourlyRate = hourlyRate;
    this.refresh();
  }

  setRateCurrency(rateCurrency: "ARS" | "USD"): void {
    this.form.rateCurrency = rateCurrency;
    this.refresh();
  }

  /** Re-reads the client catalog; used to keep the selector in sync with the client manager. */
  reloadClients(): Promise<void> {
    return this.loadClients();
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
        clientId: this.form.clientId || null,
        hourlyRate: this.form.hourlyRate.trim() || null,
        rateCurrency: this.form.rateCurrency,
      }));
      this.selectedProjectId = project.id;
      this.form = {
        kind: "work",
        outcome: "",
        nextAction: "",
        focus: "",
        clientId: "",
        hourlyRate: "",
        rateCurrency: "ARS",
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
      const [projects, clients] = await Promise.all([
        this.core.execute(new ListProjects()),
        this.core.execute(new ListClients()),
      ]);
      this.projects = sortProjects(projects);
      this.clients = sortClients(clients);
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

  private async loadClients(): Promise<void> {
    try {
      this.clients = sortClients(await this.core.execute(new ListClients()));
      this.refresh();
    } catch {
      // Keep the previously loaded options; the manager section surfaces client errors.
    }
  }

  private canSubmit(): boolean {
    return (
      this.form.outcome.trim().length > 0 &&
      this.form.nextAction.trim().length > 0 &&
      this.form.focus.trim().length > 0 &&
      this.hasValidRate()
    );
  }

  private hasValidRate(): boolean {
    const rate = this.form.hourlyRate.trim();
    if (rate === "") return true;
    const amount = Number(rate);
    return Number.isFinite(amount) && amount > 0;
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): ProjectsListViewModel {
    const activeClients = this.clients.filter((client) => client.isActive);
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
        clientLabel: this.clientLabelFor(project),
        statusLabel: project.status === "active" ? "Activo" : "Archivado",
        isSelected: project.id === this.selectedProjectId,
      })),
      clientOptions: activeClients.map((client) => ({ id: client.id, name: client.name })),
      form: {
        ...this.form,
        canSubmit: this.canSubmit() && !this.form.isSaving,
      },
    };
  }

  private clientLabelFor(project: Project): string | null {
    if (project.clientId) {
      const client = this.clients.find((candidate) => candidate.id === project.clientId);
      if (client) return client.name;
    }
    return project.client;
  }
}
