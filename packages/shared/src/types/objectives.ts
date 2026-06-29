export type ObjectiveMetricSource = "manual" | "projects_hours" | "tasks_completed";
export type ObjectiveStatus = "active" | "archived" | "achieved";

export interface Objective {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  metricSource: ObjectiveMetricSource;
  target: number;
  unit: string;
  manualValue: number | null;
  status: ObjectiveStatus;
  archivedAt: string | null;
  achievedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
