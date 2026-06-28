import type { Currency } from "./common";

export type ProjectKind = "work" | "personal";
export type ProjectStatus = "active" | "archived";
export type ClientStatus = "active" | "archived";
export type TaskBoardStatus = "backlog" | "next" | "doing" | "done";

export interface Project {
  id: string;
  kind: ProjectKind;
  outcome: string;
  nextAction: string;
  focus: string;
  clientId: string | null;
  client: string | null;
  hourlyRate: string | null;
  rateCurrency: Currency;
  status: ProjectStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  status: ClientStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  taskId: string | null;
  date: string;
  minutes: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectHoursReportRow {
  clientId: string | null;
  clientName: string | null;
  projectId: string;
  projectOutcome: string;
  weekStart: string;
  minutes: number;
  expectedIncome: ProjectExpectedIncome | null;
}

export interface ProjectExpectedIncome {
  amount: string;
  currency: Currency;
}

export interface ProjectHoursReport {
  fromDate: string;
  toDate: string;
  totalMinutes: number;
  incomeTotals: ProjectExpectedIncome[];
  rows: ProjectHoursReportRow[];
}
