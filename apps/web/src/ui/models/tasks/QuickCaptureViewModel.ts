export interface QuickCaptureViewModel {
  title: string;
  priority: number;
  domain: string;
  projectId: string;
  priorityOptions: QuickCapturePriorityOptionVM[];
  domainOptions: QuickCaptureDomainOptionVM[];
  projectOptions: QuickCaptureProjectOptionVM[];
  canCreate: boolean;
  isCreating: boolean;
  submitLabel: string;
  errorMessage: string | null;
  titlePlaceholder: string;
  titleLabel: string;
  priorityLabel: string;
  domainLabel: string;
  projectLabel: string;
  helperText: string;
  /** Non-null while the clarification gate is open for a too-vague title. */
  gate: ClarificationGateVM | null;
}

export interface ClarificationGateVM {
  heading: string;
  reasons: string[];
  outcome: string;
  nextStep: string;
  outcomeLabel: string;
  outcomePlaceholder: string;
  nextStepLabel: string;
  nextStepPlaceholder: string;
  examples: string[];
  canSaveClarified: boolean;
  saveLabel: string;
  keepEditingLabel: string;
  createAnywayLabel: string;
}

export interface QuickCapturePriorityOptionVM {
  value: number;
  label: string;
  selected: boolean;
  className: string;
}

export interface QuickCaptureDomainOptionVM {
  value: string;
  label: string;
}

export interface QuickCaptureProjectOptionVM {
  value: string;
  label: string;
}
