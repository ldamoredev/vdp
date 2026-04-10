"use client";

import { createElement, useEffect, useState, type ComponentProps } from "react";
import { useQuery } from "@tanstack/react-query";
import type { TaskInsight, Transaction } from "@/lib/api/types";
import { tasksApi } from "@/lib/api/tasks";
import { walletApi } from "@/lib/api/wallet";
import { formatDate, getTodayISO } from "@/lib/format";
import { EditTransactionSheet } from "@/features/wallet/presentation/edit-transaction/edit-transaction-sheet";
import { useTaskMutations } from "@/features/tasks/presentation/use-task-mutations";
import { DailyReviewDecisions } from "./components/daily-review-decisions";
import { DailyReviewInsightsQueue } from "./components/daily-review-insights-queue";
import { DailyReviewScreen } from "./components/daily-review-screen";
import { DailyReviewTaskQueue } from "./components/daily-review-task-queue";
import { DailyReviewWalletQueue } from "./components/daily-review-wallet-queue";
import {
  buildDailyReviewProgress,
  buildMorningReviewSummary,
  buildTaskReviewSignals,
  buildWalletReviewSignals,
} from "./daily-review-selectors";
import {
  createEmptyDailyReviewState,
  loadDailyReviewState,
  saveDailyReviewState,
} from "./daily-review-storage";

function buildTaskDetail(task: {
  carryOverCount: number;
  priority: number;
}) {
  if (task.carryOverCount > 0) {
    return `Ya se arrastra ${task.carryOverCount} vez${task.carryOverCount === 1 ? "" : "es"}. Decide si sigue viva o si conviene cortarla acá.`;
  }

  if (task.priority >= 3) {
    return "Quedó abierta con prioridad alta. Conviene decidirla antes de que contamine mañana.";
  }

  return "Sigue pendiente al cierre del día y necesita una decisión explícita.";
}

export function useDailyReviewModel(): {
  dateLabel: string;
  progressLabel: string;
  screenProps: ComponentProps<typeof DailyReviewScreen>;
  editSheetProps: {
    transaction: Transaction | null;
    open: boolean;
    onClose: () => void;
  };
} {
  const today = getTodayISO();
  const taskMutations = useTaskMutations();
  const [reviewState, setReviewState] = useState(() =>
    createEmptyDailyReviewState(today),
  );
  const [hydrated, setHydrated] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(
    null,
  );

  const { data: review } = useQuery({
    queryKey: ["review", "tasks", "review", today],
    queryFn: () => tasksApi.getReview(today),
  });

  const { data: transactionsResult } = useQuery({
    queryKey: ["review", "wallet", "transactions", today],
    queryFn: () =>
      walletApi.getTransactions({
        limit: "50",
        offset: "0",
        from: today,
        to: today,
      }),
  });

  const { data: statsSummary } = useQuery({
    queryKey: ["review", "wallet", "stats-summary", today],
    queryFn: () =>
      walletApi.getStatsSummary({
        from: today,
        to: today,
      }),
  });

  const { data: byCategory } = useQuery({
    queryKey: ["review", "wallet", "stats-by-category", today],
    queryFn: () =>
      walletApi.getStatsByCategory({
        from: today,
        to: today,
      }),
  });

  const { data: recentInsights } = useQuery({
    queryKey: ["review", "tasks", "insights", today],
    queryFn: () => tasksApi.getRecentInsights(10),
  });

  const { data: categories } = useQuery({
    queryKey: ["review", "wallet", "categories"],
    queryFn: () => walletApi.getCategories(),
  });

  useEffect(() => {
    const loaded = loadDailyReviewState(today);
    setReviewState({
      ...loaded,
      openedAt: loaded.openedAt ?? new Date().toISOString(),
    });
    setHydrated(true);
  }, [today]);

  useEffect(() => {
    if (!hydrated) return;
    saveDailyReviewState(reviewState);
  }, [hydrated, reviewState]);

  const pendingTasks = review?.pendingTasks ?? [];
  const taskSignals = buildTaskReviewSignals(pendingTasks);
  const taskQueue = pendingTasks.map((task) => ({
    id: task.id,
    title: task.title,
    detail: buildTaskDetail(task),
    carryOverCount: task.carryOverCount,
  }));

  const visibleTransactions = transactionsResult?.transactions ?? [];
  const walletSignals = buildWalletReviewSignals({
    transactions: visibleTransactions,
    byCategory: byCategory ?? [],
    acknowledgedSignalIds: reviewState.acknowledgedSignalIds,
  });

  const highlightedTransactionIds = new Set(
    walletSignals.visibleSignals.flatMap((signal) => signal.transactionIds),
  );
  const walletTransactions =
    highlightedTransactionIds.size > 0
      ? visibleTransactions.filter((transaction) =>
          highlightedTransactionIds.has(transaction.id),
        )
      : visibleTransactions.slice(0, 5);

  const unresolvedInsights = (recentInsights ?? []).filter(
    (insight) =>
      !insight.read &&
      !reviewState.acknowledgedSignalIds.includes(`insight:${insight.id}`),
  );

  const progress = buildDailyReviewProgress({
    pendingTasks: taskQueue.length,
    unresolvedWalletSignals: walletSignals.visibleSignals.length,
    unresolvedInsights: unresolvedInsights.length,
    note: reviewState.note,
  });

  useEffect(() => {
    if (!hydrated) return;

    if (progress.completed && !reviewState.completedAt) {
      setReviewState((current) => ({
        ...current,
        completedAt: new Date().toISOString(),
      }));
    }

    if (!progress.completed && reviewState.completedAt) {
      setReviewState((current) => ({
        ...current,
        completedAt: null,
      }));
    }
  }, [hydrated, progress.completed, reviewState.completedAt]);

  const watchedCategories = (categories ?? [])
    .filter((category) => category.type === "expense")
    .map((category) => ({
      id: category.id,
      name: category.name,
      watched: reviewState.watchedCategoryIds.includes(category.id),
    }));

  const summary = buildMorningReviewSummary({
    watchedCategoryNames: watchedCategories
      .filter((category) => category.watched)
      .map((category) => category.name),
    note: reviewState.note,
  });

  function acknowledgeSignal(signalId: string) {
    setReviewState((current) => ({
      ...current,
      acknowledgedSignalIds: current.acknowledgedSignalIds.includes(signalId)
        ? current.acknowledgedSignalIds
        : [...current.acknowledgedSignalIds, signalId],
    }));
  }

  function acknowledgeInsight(insightId: string) {
    acknowledgeSignal(`insight:${insightId}`);
  }

  function toggleWatchedCategory(categoryId: string) {
    setReviewState((current) => ({
      ...current,
      watchedCategoryIds: current.watchedCategoryIds.includes(categoryId)
        ? current.watchedCategoryIds.filter((id) => id !== categoryId)
        : [...current.watchedCategoryIds, categoryId],
    }));
  }

  const walletSummary =
    statsSummary && Number(statsSummary.transactionCount) > 0
      ? `${statsSummary.transactionCount} movimiento${statsSummary.transactionCount === 1 ? "" : "s"} revisables hoy.`
      : undefined;
  const taskSummary =
    taskSignals.visibleSignals.length > 0
      ? `${taskSignals.visibleSignals.length} señal${taskSignals.visibleSignals.length === 1 ? "" : "es"} de tareas para resolver antes del cierre.`
      : undefined;

  const dateLabel = formatDate(today, "EEEE, d MMM");

  return {
    dateLabel,
    progressLabel: progress.label,
    screenProps: {
      dateLabel,
      progressLabel: progress.label,
      taskSection: createElement(DailyReviewTaskQueue, {
        tasks: taskQueue,
        onComplete: taskMutations.completeTask,
        onCarryOver: taskMutations.carryOverTask,
        onDiscard: taskMutations.discardTask,
        isTaskBusy: taskMutations.isTaskBusy,
      }),
      walletSection: createElement(DailyReviewWalletQueue, {
        signals: walletSignals.visibleSignals,
        transactions: walletTransactions,
        summary: walletSummary,
        onAcknowledgeSignal: acknowledgeSignal,
        onEditTransaction: setEditingTransaction,
      }),
      insightsSection: createElement(DailyReviewInsightsQueue, {
        insights: unresolvedInsights as TaskInsight[],
        onAcknowledgeInsight: acknowledgeInsight,
      }),
      decisionsSection: createElement(DailyReviewDecisions, {
        categories: watchedCategories,
        note: reviewState.note,
        summary:
          summary ||
          taskSummary ||
          "Todavía no dejaste una señal clara para el próximo arranque.",
        onToggleCategory: toggleWatchedCategory,
        onNoteChange: (value: string) =>
          setReviewState((current) => ({ ...current, note: value })),
      }),
    },
    editSheetProps: {
      transaction: editingTransaction,
      open: !!editingTransaction,
      onClose: () => setEditingTransaction(null),
    },
  };
}
