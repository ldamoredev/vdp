export interface InboxTriageTargetVM {
  routedTo: string;
  label: string;
  href: string;
}

export interface InboxItemVM {
  id: string;
  text: string;
  note: string | null;
  capturedLabel: string;
  triageTargets: InboxTriageTargetVM[];
}

export interface InboxViewModel {
  isLoading: boolean;
  error: string | null;
  draft: string;
  isSaving: boolean;
  canSubmit: boolean;
  pendingCount: number;
  items: InboxItemVM[];
}
