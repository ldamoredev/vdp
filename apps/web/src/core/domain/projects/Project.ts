import type { Project as ProjectDto, ProjectKind, ProjectStatus } from "@vdp/shared";

export class Project {
  private constructor(
    readonly id: string,
    readonly kind: ProjectKind,
    readonly outcome: string,
    readonly nextAction: string,
    readonly focus: string,
    readonly client: string | null,
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
      dto.client,
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
