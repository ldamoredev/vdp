import type { TaskNoteType } from "@/core/domain/tasks/TaskNote";

export interface DetailPanelViewModel {
  title: string;
  selectedTask: DetailTaskSummaryVM | null;
  selector: DetailTaskSelectorVM;
  breakdownSuggestions: BreakdownSuggestionVM[];
  breakdownForm: BreakdownFormVM;
  persistedSteps: NoteListVM;
  noteForm: NoteFormVM;
  blockerNotes: NoteListVM;
  contextNotes: NoteListVM;
  emptyState: DetailEmptyStateVM | null;
  isLoading: boolean;
}

export interface DetailTaskSummaryVM {
  id: string;
  eyebrow: string;
  title: string;
  statusLabel: string;
  description: string;
  priority: number;
  domain: string | null;
  metrics: DetailMetricVM[];
}

export interface DetailMetricVM {
  label: string;
  value: string;
  className: string;
}

export interface DetailTaskSelectorVM {
  label: string;
  items: DetailTaskSelectorItemVM[];
}

export interface DetailTaskSelectorItemVM {
  id: string;
  title: string;
  selected: boolean;
  className: string;
}

export interface BreakdownSuggestionVM {
  title: string;
  steps: BreakdownSuggestionStepVM[];
}

export interface BreakdownSuggestionStepVM {
  content: string;
  disabled: boolean;
}

export interface BreakdownFormVM {
  label: string;
  value: string;
  placeholder: string;
  canAdd: boolean;
  isAdding: boolean;
  submitLabel: string;
}

export interface NoteFormVM {
  label: string;
  value: string;
  type: TaskNoteType;
  typeOptions: NoteTypeOptionVM[];
  placeholder: string;
  canAdd: boolean;
  isAdding: boolean;
  submitLabel: string;
}

export interface NoteTypeOptionVM {
  value: TaskNoteType;
  label: string;
}

export interface NoteListVM {
  title: string;
  items: NoteItemVM[];
  emptyMessage: string;
}

export interface NoteItemVM {
  id: string;
  content: string;
  label: string;
  className: string;
}

export interface DetailEmptyStateVM {
  description: string;
}
