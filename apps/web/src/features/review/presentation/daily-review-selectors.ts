import type { Task } from "@/lib/api/types";
import type {
  BuildWalletReviewSignalsArgs,
  DailyReviewProgress,
  MorningReviewSummaryArgs,
  PendingReviewTask,
  ReviewSignalResult,
  TaskReviewSignal,
  WalletReviewSignal,
} from "./daily-review-types";

function buildSignalId(scope: "wallet" | "task", kind: string, suffix: string) {
  return `${scope}:${kind}:${suffix}`;
}

export function buildWalletReviewSignals({
  transactions,
  byCategory,
  acknowledgedSignalIds,
}: BuildWalletReviewSignalsArgs): ReviewSignalResult<WalletReviewSignal> {
  const signals: WalletReviewSignal[] = [];
  const expenseTransactions = transactions.filter(
    (transaction) => transaction.type === "expense",
  );

  const uncategorized = expenseTransactions.filter(
    (transaction) => !transaction.categoryId,
  );

  if (uncategorized.length > 0) {
    signals.push({
      id: buildSignalId("wallet", "uncategorized", "today"),
      kind: "uncategorized",
      title: "Hay gastos sin categoría",
      body: "Conviene asignarles una categoría antes de cerrar el día.",
      transactionIds: uncategorized.map((transaction) => transaction.id),
    });
  }

  const totalExpenseAmount = expenseTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0,
  );

  for (const category of byCategory) {
    const categoryShare =
      totalExpenseAmount > 0 ? category.total / totalExpenseAmount : 0;

    if (category.total >= 20000 || categoryShare >= 0.5) {
      signals.push({
        id: buildSignalId("wallet", "category-spike", category.categoryId ?? "none"),
        kind: "category-spike",
        title: `Revisar ${category.categoryName}`,
        body: "Este rubro concentra una parte grande del gasto visible de hoy.",
        transactionIds: expenseTransactions
          .filter((transaction) => transaction.categoryId === category.categoryId)
          .map((transaction) => transaction.id),
        categoryId: category.categoryId,
      });
    }
  }

  for (const transaction of expenseTransactions) {
    if (Number(transaction.amount) >= 50000) {
      signals.push({
        id: buildSignalId("wallet", "high-amount", transaction.id),
        kind: "high-amount",
        title: "Monto alto para revisar",
        body: "Conviene verificar importe, cuenta y descripción antes del cierre.",
        transactionIds: [transaction.id],
        categoryId: transaction.categoryId,
      });
    }
  }

  return {
    allSignals: signals,
    visibleSignals: signals.filter(
      (signal) => !acknowledgedSignalIds.includes(signal.id),
    ),
  };
}

export function buildTaskReviewSignals(
  tasks: PendingReviewTask[],
): ReviewSignalResult<TaskReviewSignal> {
  const pendingTasks = tasks.filter((task) => task.status === "pending");
  const signals: TaskReviewSignal[] = [];

  const carried = pendingTasks.filter((task) => task.carryOverCount > 0);
  if (carried.length > 0) {
    signals.push({
      id: buildSignalId("task", "carry-over", "today"),
      kind: "carry-over",
      title: "Hay tareas arrastradas",
      body: "Estas tareas necesitan una decisión explícita antes de cerrar el día.",
      taskIds: carried.map((task) => task.id),
    });
  }

  const urgent = pendingTasks.filter(
    (task) => task.priority >= 3 && task.carryOverCount === 0,
  );
  if (urgent.length > 0) {
    signals.push({
      id: buildSignalId("task", "high-priority", "today"),
      kind: "high-priority",
      title: "Quedaron prioridades altas abiertas",
      body: "Revisa si vale la pena llevarlas a mañana o cerrarlas ahora.",
      taskIds: urgent.map((task) => task.id),
    });
  }

  return {
    allSignals: signals,
    visibleSignals: signals,
  };
}

export function buildDailyReviewProgress(args: {
  pendingTasks: number;
  unresolvedWalletSignals: number;
  unresolvedInsights: number;
  note: string;
}): DailyReviewProgress {
  const blocks = [
    args.pendingTasks === 0,
    args.unresolvedWalletSignals === 0,
    args.unresolvedInsights === 0,
    args.note.trim().length > 0,
  ];
  const resolvedBlocks = blocks.filter(Boolean).length;
  const totalBlocks = blocks.length;
  const completed = resolvedBlocks === totalBlocks;

  return {
    completed,
    label: completed
      ? "Ritual cerrado"
      : `${resolvedBlocks} de ${totalBlocks} bloques resueltos`,
    resolvedBlocks,
    totalBlocks,
  };
}

export function buildMorningReviewSummary({
  watchedCategoryNames,
  note,
}: MorningReviewSummaryArgs) {
  const parts: string[] = [];

  if (watchedCategoryNames.length > 0) {
    parts.push(`Vigilar ${watchedCategoryNames.join(", ")}`);
  }

  if (note.trim().length > 0) {
    parts.push(note.trim());
  }

  return parts.join(" · ");
}
