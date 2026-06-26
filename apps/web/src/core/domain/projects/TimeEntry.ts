import type {
  ProjectHoursReport as ProjectHoursReportDto,
  ProjectHoursReportRow,
  TimeEntry as TimeEntryDto,
} from "@vdp/shared";

export class TimeEntry {
  private constructor(
    readonly id: string,
    readonly projectId: string,
    readonly taskId: string | null,
    readonly date: string,
    readonly minutes: number,
    readonly note: string | null,
    readonly createdAt: string,
    readonly updatedAt: string,
  ) {}

  static from(dto: TimeEntryDto): TimeEntry {
    return new TimeEntry(
      dto.id,
      dto.projectId,
      dto.taskId,
      dto.date,
      dto.minutes,
      dto.note,
      dto.createdAt,
      dto.updatedAt,
    );
  }
}

export class ProjectHoursReport {
  private constructor(
    readonly fromDate: string,
    readonly toDate: string,
    readonly totalMinutes: number,
    readonly rows: ProjectHoursReportRow[],
  ) {}

  static from(dto: ProjectHoursReportDto): ProjectHoursReport {
    return new ProjectHoursReport(dto.fromDate, dto.toDate, dto.totalMinutes, dto.rows);
  }
}

/** Formats a minute count as a compact "Xh Ym" label (e.g. 90 → "1h 30m"). */
export function formatMinutes(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/** Parses a decimal-hours input (e.g. "1.5") into whole minutes, or null if invalid. */
export function hoursToMinutes(hours: string): number | null {
  const value = Number(hours);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 60);
}
