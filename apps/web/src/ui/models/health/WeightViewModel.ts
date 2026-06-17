export interface WeightViewModel {
  isLoading: boolean;
  error: boolean;
  newWeight: string;
  newDate: string;
  isSaving: boolean;
  canSave: boolean;
  currentWeightLabel: string;
  changeLabel: string;
  rangeLabel: string;
  sparkline: WeightSparklineVM | null;
  entries: WeightEntryRowVM[];
}

export interface WeightSparklineVM {
  points: string;
  minLabel: string;
  maxLabel: string;
}

export interface WeightEntryRowVM {
  id: string;
  dateLabel: string;
  weightLabel: string;
}
