export interface ProjectListItemVM {
  id: string;
  outcome: string;
  nextAction: string;
  focus: string;
  kindLabel: string;
  clientLabel: string | null;
  statusLabel: string;
  isSelected: boolean;
}

export interface ClientOptionVM {
  id: string;
  name: string;
}

export interface ProjectsListViewModel {
  isLoading: boolean;
  error: string | null;
  selectedProjectId: string | null;
  projects: ProjectListItemVM[];
  clientOptions: ClientOptionVM[];
  form: {
    kind: "work" | "personal";
    outcome: string;
    nextAction: string;
    focus: string;
    clientId: string;
    hourlyRate: string;
    rateCurrency: "ARS" | "USD";
    isOpen: boolean;
    isSaving: boolean;
    canSubmit: boolean;
  };
}
