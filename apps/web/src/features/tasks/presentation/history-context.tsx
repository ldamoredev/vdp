"use client";

import { createContext } from "react";
import type { Task, TaskReview } from "@/lib/api/types";
import type { ReviewSignal } from "./history-selectors";
import { useHistoryModel } from "./use-history-model";

/* ------------------------------------------------------------------ */
/*  Context value types                                                */
/* ------------------------------------------------------------------ */

export interface HistoryQueriesValue {
  selectedDate: Date;
  dateISO: string;
  nextReviewDate: Date;
  isToday: boolean;
  review: TaskReview | undefined;
  trend: { date: string; completionRate: number }[] | undefined;
  domainStats: { domain: string | null; total: number; completed: number }[] | undefined;
  completedTasks: Task[];
  pendingTasks: Task[];
  discardedTasks: Task[];
  reviewSignals: ReviewSignal[];
  isCarryingOverAll: boolean;
}

export interface HistoryActionsValue {
  goBack: () => void;
  goForward: () => void;
  isTaskBusy: (taskId: string) => boolean;
  carryOverAll: () => void;
  carryOverTask: (taskId: string) => void;
  discardTask: (taskId: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Contexts                                                           */
/* ------------------------------------------------------------------ */

export const HistoryQueriesContext = createContext<HistoryQueriesValue | null>(null);
export const HistoryActionsContext = createContext<HistoryActionsValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const model = useHistoryModel();

  const queriesValue: HistoryQueriesValue = {
    selectedDate: model.selectedDate,
    dateISO: model.dateISO,
    nextReviewDate: model.nextReviewDate,
    isToday: model.isToday,
    review: model.review,
    trend: model.trend,
    domainStats: model.domainStats,
    completedTasks: model.completedTasks,
    pendingTasks: model.pendingTasks,
    discardedTasks: model.discardedTasks,
    reviewSignals: model.reviewSignals,
    isCarryingOverAll: model.isCarryingOverAll,
  };

  // Not memoized — see tasks-context.tsx comment for rationale.
  const actionsValue: HistoryActionsValue = {
    goBack: model.goBack,
    goForward: model.goForward,
    isTaskBusy: model.isTaskBusy,
    carryOverAll: model.carryOverAll,
    carryOverTask: model.carryOverTask,
    discardTask: model.discardTask,
  };

  return (
    <HistoryActionsContext value={actionsValue}>
      <HistoryQueriesContext value={queriesValue}>
        {children}
      </HistoryQueriesContext>
    </HistoryActionsContext>
  );
}
