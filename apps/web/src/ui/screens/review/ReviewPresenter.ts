import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { CategoryStat, TaskInsight, TaskReview, WalletStatsSummary } from "@/lib/api/types";
import type { CarryOverRateResponse, MoodCheckInsResponse } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { GetMoodCheckIns } from "@/core/app/health/GetMoodCheckIns";
import { SaveMoodCheckIn } from "@/core/app/health/SaveMoodCheckIn";
import { GetHoursReport } from "@/core/app/projects/GetHoursReport";
import { CarryOverTask } from "@/core/app/tasks/CarryOverTask";
import { CompleteTask } from "@/core/app/tasks/CompleteTask";
import { DiscardTask } from "@/core/app/tasks/DiscardTask";
import { GetCarryOverRate } from "@/core/app/tasks/GetCarryOverRate";
import { GetDailyReviewState } from "@/core/app/tasks/GetDailyReviewState";
import { SaveDailyReviewState } from "@/core/app/tasks/SaveDailyReviewState";
import { GetRecentInsights } from "@/core/app/tasks/GetRecentInsights";
import { GetTaskReview } from "@/core/app/tasks/GetTaskReview";
import { GetCategories } from "@/core/app/wallet/GetCategories";
import { GetTransactions } from "@/core/app/wallet/GetTransactions";
import { GetWalletStatsByCategory } from "@/core/app/wallet/GetWalletStatsByCategory";
import { GetWalletStatsSummary } from "@/core/app/wallet/GetWalletStatsSummary";
import type { Category } from "@/core/domain/wallet/Category";
import type { ProjectHoursReport } from "@/core/domain/projects/TimeEntry";
import type { Transaction } from "@/core/domain/wallet/Transaction";
import { formatDate, getTodayISO } from "@/lib/format";
import { synthesisBriefStore } from "@/lib/synthesis-brief-store";
import type { TasksEvents } from "@/ui/events/TasksEvents";
import type { ReviewViewModel } from "@/ui/models/review/ReviewViewModel";
import { buildTodayProjectHoursVM } from "@/ui/screens/projects/today-project-hours";
import { buildReviewAgentBrief } from "./review-agent-brief";
import {
  buildDailyReviewProgress,
  buildMorningReviewSummary,
  buildTaskReviewSignals,
  buildWalletReviewSignals,
} from "./daily-review-selectors";
import {
  createEmptyDailyReviewState,
  mergePersistedDailyReviewState,
} from "./daily-review-storage";
import type { DailyReviewState } from "./daily-review-types";

/** Coalesce rapid ceremony edits (e.g. typing the note) into one server write. */
const PERSIST_DEBOUNCE_MS = 400;

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
 * movements + insights over the Core, and owns the review ceremony state
 * (acknowledged signals, watched categories, note, completion). Replaces the
 * former React-Query `useDailyReviewModel` hook. The ceremony state is now
 * persisted server-side over the Core bus (R1) so the ritual is shared across
 * devices; edits update in memory immediately and are flushed with a short
 * debounce.
 */
export class ReviewPresenter extends PresenterBase<ReviewViewModel> {
  private readonly today = getTodayISO();
  private reviewState: DailyReviewState = createEmptyDailyReviewState(this.today);
  private hydrated = false;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  private review: TaskReview | null = null;
  private transactions: Transaction[] = [];
  private statsSummary: WalletStatsSummary | null = null;
  private byCategory: CategoryStat[] = [];
  private insights: TaskInsight[] = [];
  private categories: Category[] = [];
  private projectHoursReport: ProjectHoursReport | null = null;
  private moodOverview: MoodCheckInsResponse | null = null;
  private carryOverRate: CarryOverRateResponse | null = null;
  private savingMoodCheckIn = false;
  private moodCheckInError: string | null = null;

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
    this.events.tasksChanged.unsubscribe(this);
    this.events.tasksChanged.subscribe(this, () => void this.load());
    void this.hydrate();
  }

  stop(): void {
    this.events.tasksChanged.unsubscribe(this);
    this.flushPersist();
    synthesisBriefStore.clearReviewBrief();
  }

  /** Pull the day's ceremony state and the aggregated data concurrently, then stamp the open. */
  private async hydrate(): Promise<void> {
    const loadPromise = this.load();
    let persisted: DailyReviewState | null;
    try {
      persisted = await this.core.execute(new GetDailyReviewState(this.today));
    } catch {
      persisted = null;
    }
    const base = createEmptyDailyReviewState(this.today);
    const loaded = mergePersistedDailyReviewState(base, persisted);
    this.reviewState = { ...loaded, openedAt: loaded.openedAt ?? new Date().toISOString() };
    this.hydrated = true;
    // Persist the opened stamp so the morning surface knows the ritual was started.
    this.schedulePersist();
    this.refresh();
    await loadPromise;
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

  async saveMoodCheckIn(mood: number, energy: number): Promise<void> {
    if (this.savingMoodCheckIn) return;
    this.savingMoodCheckIn = true;
    this.moodCheckInError = null;
    this.refresh();
    try {
      const checkIn = await this.core.execute(new SaveMoodCheckIn({ mood, energy }));
      const previousCheckIns = (this.moodOverview?.checkIns ?? [])
        .filter((existing) => existing.date !== checkIn.date);
      const checkIns = [checkIn, ...previousCheckIns];
      this.moodOverview = {
        ...(this.moodOverview ?? emptyMoodOverview(this.today)),
        checkIns,
        summary: summarizeMoodCheckIns(
          checkIns,
          this.moodOverview?.summary.days ?? 7,
          this.moodOverview?.summary.habitCompletionRate ?? 0,
        ),
      };
    } catch {
      this.moodCheckInError = "No se pudo guardar el check-in. Revisá que el backend esté actualizado.";
    } finally {
      this.savingMoodCheckIn = false;
      this.refresh();
    }
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
    const [review, transactionsResult, statsSummary, byCategory, insights, categories, moodOverview, carryOverRate, projectHoursReport] =
      await Promise.all([
        this.core.execute(new GetTaskReview(this.today)),
        this.core.execute(new GetTransactions({ limit: "50", offset: "0", from: this.today, to: this.today })),
        this.core.execute(new GetWalletStatsSummary({ from: this.today, to: this.today })),
        this.core.execute(new GetWalletStatsByCategory({ from: this.today, to: this.today })),
        this.core.execute(new GetRecentInsights(10)),
        this.core.execute(new GetCategories()),
        this.core.execute(new GetMoodCheckIns(7)),
        this.core.execute(new GetCarryOverRate(7)),
        this.core.execute(new GetHoursReport({ fromDate: this.today, toDate: this.today }))
          .catch(() => null),
      ]);
    this.review = review;
    this.transactions = transactionsResult.transactions;
    this.statsSummary = statsSummary;
    this.byCategory = byCategory;
    this.insights = insights;
    this.categories = categories;
    this.projectHoursReport = projectHoursReport;
    this.moodOverview = moodOverview;
    this.carryOverRate = carryOverRate;
    this.refresh();
  }

  private updateState(mutator: (current: DailyReviewState) => DailyReviewState): void {
    this.reviewState = mutator(this.reviewState);
    this.schedulePersist();
    this.refresh();
  }

  /** Debounced, best-effort server write; the in-memory state always drives the UI. */
  private schedulePersist(): void {
    if (!this.hydrated) return;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      void this.persist();
    }, PERSIST_DEBOUNCE_MS);
  }

  private flushPersist(): void {
    if (!this.persistTimer) return;
    clearTimeout(this.persistTimer);
    this.persistTimer = null;
    void this.persist();
  }

  private async persist(): Promise<void> {
    try {
      await this.core.execute(new SaveDailyReviewState(this.reviewState));
    } catch {
      // Best-effort: a failed sync leaves the in-memory state intact for this session.
    }
  }

  private refresh(): void {
    const model = this.buildModel();
    this.updateModel(model);
    synthesisBriefStore.setReviewBrief(buildReviewAgentBrief(model));
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
      moodCheckedIn: this.todaysMoodCheckIn() !== null,
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
    const focusTask = this.review?.allTasks.find((task) => task.id === this.reviewState.focusTaskId);
    const morningFocusSummary = focusTask ? `Foco de la mañana: ${focusTask.title}.` : undefined;
    const decisionSummary = [morningFocusSummary, morningSummary].filter(Boolean).join(" ");
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
      projectHours: buildTodayProjectHoursVM(this.projectHoursReport),
      mood: this.buildMoodModel(),
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
          decisionSummary ||
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
      this.schedulePersist();
    } else if (!completed && this.reviewState.completedAt) {
      this.reviewState = { ...this.reviewState, completedAt: null };
      this.schedulePersist();
    }
  }

  private buildMoodModel(): ReviewViewModel["mood"] {
    const todayCheckIn = this.todaysMoodCheckIn();
    const selectedMood = todayCheckIn?.mood ?? null;
    const selectedEnergy = todayCheckIn?.energy ?? null;
    const summary = this.moodOverview?.summary ?? emptyMoodOverview(this.today).summary;

    return {
      selectedMood,
      selectedEnergy,
      moodOptions: scoreOptions(selectedMood),
      energyOptions: scoreOptions(selectedEnergy),
      isSaving: this.savingMoodCheckIn,
      error: this.moodCheckInError,
      weeklyInsight: buildMoodWeeklyInsight(summary, this.carryOverRate),
      summary: summary.checkInCount > 0
        ? `${summary.checkInCount}/${summary.days} registros · hábitos ${summary.habitCompletionRate}%`
        : "Sin registros esta semana",
    };
  }

  private todaysMoodCheckIn() {
    return this.moodOverview?.checkIns.find((checkIn) => checkIn.date === this.today) ?? null;
  }
}

function scoreOptions(selected: number | null) {
  return [1, 2, 3, 4, 5].map((value) => ({
    value,
    label: String(value),
    selected: selected === value,
  }));
}

function buildMoodWeeklyInsight(
  summary: MoodCheckInsResponse["summary"],
  carryOver: CarryOverRateResponse | null,
): string {
  if (summary.averageMood === null) {
    return "Registrá ánimo y energía para empezar a ver el patrón semanal.";
  }
  if (summary.averageMood <= 2 && carryOver && carryOver.rate > 40) {
    return `Ánimo bajo (${summary.averageMood}/5) y carry-over ${carryOver.rate}% esta semana. Bajá carga o cerrá pendientes chicos.`;
  }
  if (summary.habitCompletionRate < 50) {
    return `Ánimo ${summary.averageMood}/5 con hábitos al ${summary.habitCompletionRate}%. Conviene mirar fricción antes de sumar tareas.`;
  }
  return `Ánimo ${summary.averageMood}/5 y energía ${summary.averageEnergy ?? "sin dato"}/5. La semana empieza a dejar señal.`;
}

function emptyMoodOverview(date: string): MoodCheckInsResponse {
  return {
    checkIns: [],
    date,
    summary: {
      days: 7,
      checkInCount: 0,
      averageMood: null,
      averageEnergy: null,
      habitCompletionRate: 0,
    },
  };
}

function summarizeMoodCheckIns(
  checkIns: MoodCheckInsResponse["checkIns"],
  days: number,
  habitCompletionRate: number,
): MoodCheckInsResponse["summary"] {
  if (checkIns.length === 0) {
    return { days, checkInCount: 0, averageMood: null, averageEnergy: null, habitCompletionRate };
  }
  const average = (values: number[]) =>
    Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  return {
    days,
    checkInCount: checkIns.length,
    averageMood: average(checkIns.map((checkIn) => checkIn.mood)),
    averageEnergy: average(checkIns.map((checkIn) => checkIn.energy)),
    habitCompletionRate,
  };
}
