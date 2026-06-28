import type { Currency, Project as ProjectDto, ProjectKind, ProjectStatus } from "@vdp/shared";

export class Project {
  private constructor(
    readonly id: string,
    readonly kind: ProjectKind,
    readonly outcome: string,
    readonly nextAction: string,
    readonly focus: string,
    readonly clientId: string | null,
    readonly client: string | null,
    readonly hourlyRate: string | null,
    readonly rateCurrency: Currency,
    readonly status: ProjectStatus,
    readonly archivedAt: string | null,
    readonly createdAt: string,
    readonly updatedAt: string,
  ) {}

  static from(dto: ProjectDto): Project {
    return new Project(
      dto.id,
      dto.kind,
      dto.outcome,
      dto.nextAction,
      dto.focus,
      dto.clientId ?? null,
      dto.client,
      dto.hourlyRate,
      dto.rateCurrency,
      dto.status,
      dto.archivedAt,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  get isActive(): boolean {
    return this.status === "active";
  }
}

export function sortProjects(projects: readonly Project[]): Project[] {
  return [...projects].sort((left, right) => {
    if (left.isActive !== right.isActive) return left.isActive ? -1 : 1;
    return right.updatedAt.localeCompare(left.updatedAt);
  });
}
