export interface ArchivedProjectVM {
  id: string;
  outcome: string;
  kindLabel: string;
  clientLabel: string | null;
  archivedAtLabel: string;
  totalHoursLabel: string;
  isUnarchiving: boolean;
}

export interface ProjectHistoryViewModel {
  isLoading: boolean;
  error: string | null;
  projects: ArchivedProjectVM[];
}
