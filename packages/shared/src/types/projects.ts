export type ProjectKind = "work" | "personal";
export type ProjectStatus = "active" | "archived";
export type TaskBoardStatus = "backlog" | "next" | "doing" | "done";

export interface Project {
  id: string;
  kind: ProjectKind;
  outcome: string;
  nextAction: string;
  focus: string;
  client: string | null;
  status: ProjectStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
