export type ObjectiveMetricSource =
  | "manual"
  | "projects_hours"
  | "tasks_completed"
  | "wallet_savings"
  | "health_habit_completions";
export type ObjectiveStatus = "active" | "archived" | "achieved";
export type ObjectiveCurrency = "ARS" | "USD";

export interface Objective {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  metricSource: ObjectiveMetricSource;
  metricTargetId: string | null;
  target: number;
  unit: string;
  manualValue: number | null;
  currency: ObjectiveCurrency | null;
  status: ObjectiveStatus;
  archivedAt: string | null;
  achievedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
