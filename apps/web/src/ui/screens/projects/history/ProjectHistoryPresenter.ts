import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { ListClients } from "@/core/app/projects/ListClients";
import { ListProjects } from "@/core/app/projects/ListProjects";
import { ListTimeEntries } from "@/core/app/projects/ListTimeEntries";
import { UnarchiveProject } from "@/core/app/projects/UnarchiveProject";
import type { Client } from "@/core/domain/projects/Client";
import type { Project } from "@/core/domain/projects/Project";
import { formatMinutes, type TimeEntry } from "@/core/domain/projects/TimeEntry";
import { formatDate } from "@/lib/format";
import type { ProjectHistoryViewModel } from "@/ui/models/projects/ProjectHistoryViewModel";

export class ProjectHistoryPresenter extends PresenterBase<ProjectHistoryViewModel> {
  private projects: Project[] = [];
  private clients: Client[] = [];
  private timeEntries: TimeEntry[] = [];
  private isLoading = true;
  private error: string | null = null;
  private unarchivingId: string | null = null;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): ProjectHistoryViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
  }

  async unarchiveProject(id: string): Promise<void> {
    if (this.unarchivingId) return;
    this.unarchivingId = id;
    this.refresh();
    try {
      await this.core.execute(new UnarchiveProject(id));
      await this.load();
    } catch {
      this.error = "No pudimos desarchivar el proyecto.";
    } finally {
      this.unarchivingId = null;
      this.refresh();
    }
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      const [projects, clients, entries] = await Promise.all([
        this.core.execute(new ListProjects()),
        this.core.execute(new ListClients()),
        this.core.execute(new ListTimeEntries()),
      ]);
      this.projects = projects;
      this.clients = clients;
      this.timeEntries = entries;
      this.error = null;
    } catch {
      this.error = "No pudimos cargar el historial de proyectos.";
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): ProjectHistoryViewModel {
    const archived = this.projects
      .filter((project) => !project.isActive)
      .sort((left, right) => (right.archivedAt ?? "").localeCompare(left.archivedAt ?? ""));
    return {
      isLoading: this.isLoading,
      error: this.error,
      projects: archived.map((project) => ({
        id: project.id,
        outcome: project.outcome,
        kindLabel: project.kind === "work" ? "Trabajo" : "Personal",
        clientLabel: this.clientLabelFor(project),
        archivedAtLabel: project.archivedAt ? formatDate(project.archivedAt) : "",
        totalHoursLabel: formatMinutes(this.totalMinutesFor(project.id)),
        isUnarchiving: this.unarchivingId === project.id,
      })),
    };
  }

  private totalMinutesFor(projectId: string): number {
    return this.timeEntries
      .filter((entry) => entry.projectId === projectId)
      .reduce((sum, entry) => sum + entry.minutes, 0);
  }

  private clientLabelFor(project: Project): string | null {
    if (project.clientId) {
      const client = this.clients.find((candidate) => candidate.id === project.clientId);
      if (client) return client.name;
    }
    return project.client;
  }
}
