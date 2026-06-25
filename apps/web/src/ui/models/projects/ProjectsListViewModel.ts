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

export interface ProjectsListViewModel {
  isLoading: boolean;
  error: string | null;
  selectedProjectId: string | null;
  projects: ProjectListItemVM[];
  form: {
    kind: "work" | "personal";
    outcome: string;
    nextAction: string;
    focus: string;
    client: string;
    isOpen: boolean;
    isSaving: boolean;
    canSubmit: boolean;
  };
}
