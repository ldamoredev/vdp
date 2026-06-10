import type { CategoryStat, Task, Transaction } from "@/lib/api/types";

export interface DailyReviewState {
  date: string;
  acknowledgedSignalIds: string[];
  watchedCategoryIds: string[];
  note: string;
  openedAt: string | null;
  completedAt: string | null;
}

export type WalletReviewSignalKind =
  | "uncategorized"
  | "category-spike"
  | "high-amount";

export interface WalletReviewSignal {
  id: string;
  kind: WalletReviewSignalKind;
  title: string;
  body: string;
  transactionIds: string[];
  categoryId?: string | null;
}

export type TaskReviewSignalKind = "carry-over" | "high-priority";

export interface TaskReviewSignal {
  id: string;
  kind: TaskReviewSignalKind;
  title: string;
  body: string;
  taskIds: string[];
}

export interface BuildWalletReviewSignalsArgs {
  transactions: Transaction[];
  byCategory: CategoryStat[];
  acknowledgedSignalIds: string[];
}

export interface ReviewSignalResult<TSignal> {
  allSignals: TSignal[];
  visibleSignals: TSignal[];
}

export interface DailyReviewProgress {
  completed: boolean;
  label: string;
  resolvedBlocks: number;
  totalBlocks: number;
}

export interface MorningReviewSummaryArgs {
  watchedCategoryNames: string[];
  note: string;
}

export type PendingReviewTask = Pick<
  Task,
  "id" | "title" | "priority" | "carryOverCount" | "status"
>;
