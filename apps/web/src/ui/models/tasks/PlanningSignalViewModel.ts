import type { PlanningTone } from "@/core/domain/tasks/PlanningSignal";

export interface PlanningSignalViewModel {
  tone: PlanningTone;
  toneClass: string;
  eyebrow: string;
  headline: string;
  summary: string;
  metrics: PlanningSignalMetricVM[];
  recommendations: string[];
  isLoading: boolean;
}

export interface PlanningSignalMetricVM {
  label: string;
  value: string;
}
