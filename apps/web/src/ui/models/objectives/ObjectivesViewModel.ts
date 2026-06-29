import type { ObjectiveMetricSource } from "@vdp/shared";

export interface ObjectiveItemVM {
  id: string;
  title: string;
  periodLabel: string;
  sourceLabel: string;
  statusLabel: string;
  currentValueLabel: string;
  targetValueLabel: string;
  progressPercent: number;
  progressLabel: string;
  isArchived: boolean;
  isAchieved: boolean;
  tracksSavings: boolean;
}

export interface ObjectiveMetricSourceOptionVM {
  value: ObjectiveMetricSource;
  label: string;
}

export interface ObjectiveFormVM {
  isOpen: boolean;
  isEditing: boolean;
  isSaving: boolean;
  title: string;
  periodStart: string;
  periodEnd: string;
  metricSource: ObjectiveMetricSource;
  target: string;
  unit: string;
  manualValue: string;
  currency: "ARS" | "USD";
  isCurrencyScoped: boolean;
  canSubmit: boolean;
  submitLabel: string;
}

export interface ObjectivesViewModel {
  isLoading: boolean;
  error: string | null;
  objectives: ObjectiveItemVM[];
  metricSourceOptions: ObjectiveMetricSourceOptionVM[];
  form: ObjectiveFormVM;
}
