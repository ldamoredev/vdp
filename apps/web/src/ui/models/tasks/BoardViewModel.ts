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

/** Which columns the board shows: only the operable one, or all three. */
export type BoardScope = "active" | "all";

export interface BoardColumnVM {
  id: BoardTaskState;
  title: string;
  tone: BoardColumnTone;
  count: number;
  /** Non-terminal column: shows the "+" create affordance. */
  canCreate: boolean;
  isDropTarget: boolean;
  emptyText: string;
  tasks: BoardTaskVM[];
}

export interface BoardComposerVM {
  title: string;
  priority: number;
  busy: boolean;
  canSubmit: boolean;
}

export interface BoardViewModel {
  domainLabel: string;
  scope: BoardScope;
  columns: BoardColumnVM[];
  /** Id of the card currently being dragged, so the view can fade its source. */
  draggingId: string | null;
  isLoading: boolean;
  error: boolean;
  /** Inline create composer for the pending column; null when closed. */
  composer: BoardComposerVM | null;
}
