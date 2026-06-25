export type ProjectBoardColumnId = "backlog" | "next" | "doing" | "done";

export interface ProjectBoardTaskVM {
  id: string;
  title: string;
  priorityLabel: string;
  statusLabel: string;
  isBusy: boolean;
}

export interface ProjectBoardColumnVM {
  id: ProjectBoardColumnId;
  title: string;
  count: number;
  emptyText: string;
  tasks: ProjectBoardTaskVM[];
}

export interface ProjectBoardViewModel {
  projectId: string | null;
  title: string;
  subtitle: string;
  isLoading: boolean;
  error: string | null;
  columns: ProjectBoardColumnVM[];
}
