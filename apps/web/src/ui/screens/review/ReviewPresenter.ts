import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { CategoryStat, TaskInsight, TaskReview, WalletStatsSummary } from "@/lib/api/types";

import type { Core } from "@/core/Core";
import { CarryOverTask } from "@/core/app/tasks/CarryOverTask";
import { CompleteTask } from "@/core/app/tasks/CompleteTask";
import { DiscardTask } from "@/core/app/tasks/DiscardTask";
import { GetRecentInsights } from "@/core/app/tasks/GetRecentInsights";
import { GetTaskReview } from "@/core/app/tasks/GetTaskReview";
import { GetCategories } from "@/core/app/wallet/GetCategories";
import { GetTransactions } from "@/core/app/wallet/GetTransactions";
import { GetWalletStatsByCategory } from "@/core/app/wallet/GetWalletStatsByCategory";
import { GetWalletStatsSummary } from "@/core/app/wallet/GetWalletStatsSummary";
import type { Category } from "@/core/domain/wallet/Category";
import type { Transaction } from "@/core/domain/wallet/Transaction";
import { formatDate, getTodayISO } from "@/lib/format";
import type { TasksEvents } from "@/ui/events/TasksEvents";
import type { ReviewViewModel } from "@/ui/models/review/ReviewViewModel";
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
import type { DailyReviewState } from "./daily-review-types";

function buildTaskDetail(task: { carryOverCount: number; priority: number }): string {
  if (task.carryOverCount > 0) {
    return `Ya se arrastra ${task.carryOverCount} vez${task.carryOverCount === 1 ? "" : "es"}. Decide si sigue viva o si conviene cortarla acá.`;
  }
  if (task.priority >= 3) {
    return "Quedó abierta con prioridad alta. Conviene decidirla antes de que contamine mañana.";
  }
  return "Sigue pendiente al cierre del día y necesita una decisión explícita.";
}

/**
 * Drives the daily review screen: aggregates today's task review + wallet
 * movements + insights over the Core, and owns the locally-persisted review
 * state (acknowledged signals, watched categories, note, completion). Replaces
 * the former React-Query `useDailyReviewModel` hook. localStorage holds only
 * UI-side review state — there is no HTTP/storage in the data path beyond the
 * Core bus.
 */
export class ReviewPresenter extends PresenterBase<ReviewViewModel> {
  private readonly today = getTodayISO();
  private reviewState: DailyReviewState = createEmptyDailyReviewState(this.today);
  private hydrated = false;

  private review: TaskReview | null = null;
  private transactions: Transaction[] = [];
  private statsSummary: WalletStatsSummary | null = null;
  private byCategory: CategoryStat[] = [];
  private insights: TaskInsight[] = [];
  private categories: Category[] = [];

  private busyTaskIds = new Set<string>();
  private editingTransaction: Transaction | null = null;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
    private readonly events: TasksEvents,
  ) {
    super(onChange);
  }

  protected initModel(): ReviewViewModel {
    return this.buildModel();
  }

  start(): void {
    const loaded = loadDailyReviewState(this.today);
    this.reviewState = { ...loaded, openedAt: loaded.openedAt ?? new Date().toISOString() };
    this.hydrated = true;
    this.events.tasksChanged.unsubscribe(this);
    this.events.tasksChanged.subscribe(this, () => void this.load());
    void this.load();
  }

  stop(): void {
    this.events.tasksChanged.unsubscribe(this);
  }

  // ─── task decisions ──────────────────────────────────────
  completeTask(taskId: string): Promise<void> {
    return this.runForTask(taskId, () => this.core.execute(new CompleteTask(taskId)));
  }

  carryOverTask(taskId: string): Promise<void> {
    return this.runForTask(taskId, () => this.core.execute(new CarryOverTask(taskId)));
  }

  discardTask(taskId: string): Promise<void> {
    return this.runForTask(taskId, () => this.core.execute(new DiscardTask(taskId)));
  }

  isTaskBusy(taskId: string): boolean {
    return this.busyTaskIds.has(taskId);
  }

  // ─── review-state edits (persisted) ──────────────────────
  acknowledgeSignal(signalId: string): void {
    this.updateState((current) => ({
      ...current,
      acknowledgedSignalIds: current.acknowledgedSignalIds.includes(signalId)
        ? current.acknowledgedSignalIds
        : [...current.acknowledgedSignalIds, signalId],
    }));
  }

  acknowledgeInsight(insightId: string): void {
    this.acknowledgeSignal(`insight:${insightId}`);
  }

  toggleWatchedCategory(categoryId: string): void {
    this.updateState((current) => ({
      ...current,
      watchedCategoryIds: current.watchedCategoryIds.includes(categoryId)
        ? current.watchedCategoryIds.filter((id) => id !== categoryId)
        : [...current.watchedCategoryIds, categoryId],
    }));
  }

  setNote(note: string): void {
    this.updateState((current) => ({ ...current, note }));
  }

  // ─── edit sheet ──────────────────────────────────────────
  openEdit(transaction: Transaction): void {
    this.editingTransaction = transaction;
    this.refresh();
  }

  closeEdit(): void {
    this.editingTransaction = null;
    this.refresh();
  }

  async transactionUpdated(): Promise<void> {
    this.editingTransaction = null;
    this.refresh();
    await this.load();
  }

  private async runForTask(taskId: string, action: () => Promise<unknown>): Promise<void> {
    if (this.busyTaskIds.has(taskId)) return;
    this.busyTaskIds.add(taskId);
    this.refresh();
    try {
      await action();
      await this.load();
      await this.events.emitTasksChanged();
    } finally {
      this.busyTaskIds.delete(taskId);
      this.refresh();
    }
  }

  private async load(): Promise<void> {
    const [review, transactionsResult, statsSummary, byCategory, insights, categories] =
      await Promise.all([
        this.core.execute(new GetTaskReview(this.today)),
        this.core.execute(new GetTransactions({ limit: "50", offset: "0", from: this.today, to: this.today })),
        this.core.execute(new GetWalletStatsSummary({ from: this.today, to: this.today })),
        this.core.execute(new GetWalletStatsByCategory({ from: this.today, to: this.today })),
        this.core.execute(new GetRecentInsights(10)),
        this.core.execute(new GetCategories()),
      ]);
    this.review = review;
    this.transactions = transactionsResult.transactions;
    this.statsSummary = statsSummary;
    this.byCategory = byCategory;
    this.insights = insights;
    this.categories = categories;
    this.refresh();
  }

  private updateState(mutator: (current: DailyReviewState) => DailyReviewState): void {
    this.reviewState = mutator(this.reviewState);
    if (this.hydrated) saveDailyReviewState(this.reviewState);
    this.refresh();
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): ReviewViewModel {
    const pendingTasks = this.review?.pendingTasks ?? [];
    const taskQueue = pendingTasks.map((task) => ({
      id: task.id,
      title: task.title,
      detail: buildTaskDetail(task),
      carryOverCount: task.carryOverCount,
    }));
    const taskSignals = buildTaskReviewSignals(pendingTasks);

    const walletSignals = buildWalletReviewSignals({
      transactions: this.transactions,
      byCategory: this.byCategory,
      acknowledgedSignalIds: this.reviewState.acknowledgedSignalIds,
    });
    const highlightedIds = new Set(walletSignals.visibleSignals.flatMap((s) => s.transactionIds));
    const walletTransactions =
      highlightedIds.size > 0
        ? this.transactions.filter((t) => highlightedIds.has(t.id))
        : this.transactions.slice(0, 5);

    const unresolvedInsights = this.insights.filter(
      (insight) =>
        !insight.read &&
        !this.reviewState.acknowledgedSignalIds.includes(`insight:${insight.id}`),
    );

    const progress = buildDailyReviewProgress({
      pendingTasks: taskQueue.length,
      unresolvedWalletSignals: walletSignals.visibleSignals.length,
      unresolvedInsights: unresolvedInsights.length,
      note: this.reviewState.note,
    });
    this.syncCompletion(progress.completed);

    const watchedCategories = this.categories
      .filter((category) => category.type === "expense")
      .map((category) => ({
        id: category.id,
        name: category.name,
        watched: this.reviewState.watchedCategoryIds.includes(category.id),
      }));

    const morningSummary = buildMorningReviewSummary({
      watchedCategoryNames: watchedCategories.filter((c) => c.watched).map((c) => c.name),
      note: this.reviewState.note,
    });
    const taskSummary =
      taskSignals.visibleSignals.length > 0
        ? `${taskSignals.visibleSignals.length} señal${taskSignals.visibleSignals.length === 1 ? "" : "es"} de tareas para resolver antes del cierre.`
        : undefined;
    const walletSummary =
      this.statsSummary && Number(this.statsSummary.transactionCount) > 0
        ? `${this.statsSummary.transactionCount} movimiento${this.statsSummary.transactionCount === 1 ? "" : "s"} revisables hoy.`
        : undefined;

    const dateLabel = formatDate(this.today, "EEEE, d MMM");

    return {
      dateLabel,
      progressLabel: progress.label,
      taskQueue,
      wallet: {
        signals: walletSignals.visibleSignals,
        transactions: walletTransactions,
        summary: walletSummary,
      },
      insights: unresolvedInsights,
      decisions: {
        categories: watchedCategories,
        note: this.reviewState.note,
        summary:
          morningSummary ||
          taskSummary ||
          "Todavía no dejaste una señal clara para el próximo arranque.",
      },
      editSheet: {
        transaction: this.editingTransaction,
        open: this.editingTransaction !== null,
      },
    };
  }

  /** Mirror the legacy effect: stamp/clear completedAt as the review crosses done. */
  private syncCompletion(completed: boolean): void {
    if (!this.hydrated) return;
    if (completed && !this.reviewState.completedAt) {
      this.reviewState = { ...this.reviewState, completedAt: new Date().toISOString() };
      saveDailyReviewState(this.reviewState);
    } else if (!completed && this.reviewState.completedAt) {
      this.reviewState = { ...this.reviewState, completedAt: null };
      saveDailyReviewState(this.reviewState);
    }
  }
}
