export interface QuickCaptureViewModel {
  title: string;
  priority: number;
  domain: string;
  priorityOptions: QuickCapturePriorityOptionVM[];
  domainOptions: QuickCaptureDomainOptionVM[];
  canCreate: boolean;
  isCreating: boolean;
  submitLabel: string;
  errorMessage: string | null;
  titlePlaceholder: string;
  titleLabel: string;
  priorityLabel: string;
  domainLabel: string;
  helperText: string;
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
