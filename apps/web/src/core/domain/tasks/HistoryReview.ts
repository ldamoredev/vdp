import type { Task } from "./Task";

export type HistoryReviewSignalTone = "success" | "info" | "warning" | "error";
export type HistoryReviewSignalKind =
  | "clean_close"
  | "recoverable_close"
  | "overloaded_day"
  | "stuck_tasks"
  | "no_chronic_block";

export interface HistoryReviewSignal {
  kind: HistoryReviewSignalKind;
  tone: HistoryReviewSignalTone;
  count?: number;
}

export function buildHistoryReviewSignals(review: {
  pending: number;
  completionRate: number;
  pendingTasks: Task[];
}): HistoryReviewSignal[] {
  const stuckCount = review.pendingTasks.filter((task) => task.isStuck).length;
  const overloaded = review.pending >= 5 || review.completionRate < 50;

  if (review.pending === 0) {
    return [{ kind: "clean_close", tone: "success" }];
  }

  return [
    overloaded
      ? { kind: "overloaded_day", tone: "warning" }
      : { kind: "recoverable_close", tone: "info" },
    stuckCount > 0
      ? { kind: "stuck_tasks", tone: "error", count: stuckCount }
      : { kind: "no_chronic_block", tone: "success" },
  ];
}
