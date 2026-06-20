/**
 * ViewModels for the per-module task board. The presenter builds these; the
 * TaskCard / BoardColumn views render them without computing anything.
 */

export type BoardTaskState = "pending" | "done" | "discarded";

export interface BoardTaskVM {
  id: string;
  title: string;
  priority: number;
  domain: string | null;
  carryOverCount: number;
  /** Scheduled date, already formatted as an es-AR short label, e.g. "lun, 13 jun". */
  dateLabel: string;
  state: BoardTaskState;
  /** Carried over enough to need a decision (carryOverCount >= 3) while pending. */
  isStuck: boolean;
  /** A mutation for this task is in flight; quick actions are disabled. */
  busy: boolean;
}

export interface BoardTaskActions {
  onComplete: (id: string) => void;
  onCarryOver: (id: string) => void;
  onDiscard: (id: string) => void;
  onOpenDetail: (id: string) => void;
}

/** Header dot tone per board column. */
export type BoardColumnTone = "accent" | "green" | "amber" | "red" | "muted";
