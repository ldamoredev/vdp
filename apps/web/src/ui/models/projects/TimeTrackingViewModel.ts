export interface TimeEntryRowVM {
  id: string;
  dateLabel: string;
  durationLabel: string;
  note: string | null;
  isBusy: boolean;
}

export interface TimeTrackingViewModel {
  projectId: string | null;
  isLoading: boolean;
  error: string | null;
  totalLabel: string;
  entries: TimeEntryRowVM[];
  form: {
    date: string;
    hours: string;
    note: string;
    isSaving: boolean;
    canSubmit: boolean;
  };
}
