import type {
  Objective as ObjectiveDto,
  ObjectiveMetricSource,
  ObjectiveStatus,
} from "@vdp/shared";

export class Objective {
  private constructor(
    readonly id: string,
    readonly title: string,
    readonly periodStart: string,
    readonly periodEnd: string,
    readonly metricSource: ObjectiveMetricSource,
    readonly target: number,
    readonly unit: string,
    readonly manualValue: number | null,
    readonly status: ObjectiveStatus,
    readonly archivedAt: string | null,
    readonly achievedAt: string | null,
    readonly createdAt: string,
    readonly updatedAt: string,
  ) {}

  static from(dto: ObjectiveDto): Objective {
    return new Objective(
      dto.id,
      dto.title,
      dto.periodStart,
      dto.periodEnd,
      dto.metricSource,
      dto.target,
      dto.unit,
      dto.manualValue,
      dto.status,
      dto.archivedAt,
      dto.achievedAt,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  get isActive(): boolean {
    return this.status === "active";
  }
}

export function sortObjectives(objectives: readonly Objective[]): Objective[] {
  return [...objectives].sort((left, right) => {
    if (left.isActive !== right.isActive) return left.isActive ? -1 : 1;
    return right.updatedAt.localeCompare(left.updatedAt);
  });
}
