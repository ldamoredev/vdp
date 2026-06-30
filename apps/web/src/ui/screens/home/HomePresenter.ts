import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type {
  CarryOverRateResponse,
  CategoryStat,
  DomainStat,
  Task as TaskDto,
  TaskInsight,
  TaskInsightAction,
  TaskInsightMetadata,
  TaskReview,
  TaskStats,
  TaskTrendDay,
} from "@/lib/api/types";

import type { Core } from "@/core/Core";
import { ListObjectives } from "@/core/app/objectives/ListObjectives";
import { resolveObjectiveCurrentValue } from "@/core/app/objectives/metric-sources";
import { GetHoursReport } from "@/core/app/projects/GetHoursReport";
import { CarryOverAll } from "@/core/app/tasks/CarryOverAll";
import { CompleteTask } from "@/core/app/tasks/CompleteTask";
import { CreateTask } from "@/core/app/tasks/CreateTask";
import { GetCarryOverRate } from "@/core/app/tasks/GetCarryOverRate";
import { GetDailyReviewState } from "@/core/app/tasks/GetDailyReviewState";
import { GetRecentInsights } from "@/core/app/tasks/GetRecentInsights";
import { GetTaskReview } from "@/core/app/tasks/GetTaskReview";
import { GetTaskTrend } from "@/core/app/tasks/GetTaskTrend";
import { GetTasksByDomain } from "@/core/app/tasks/GetTasksByDomain";
import { GetTodayStats } from "@/core/app/tasks/GetTodayStats";
import { ListTasks } from "@/core/app/tasks/ListTasks";
import { SaveDailyReviewState } from "@/core/app/tasks/SaveDailyReviewState";
import { GetTransactions } from "@/core/app/wallet/GetTransactions";
import { GetWalletStatsByCategory } from "@/core/app/wallet/GetWalletStatsByCategory";
import { GetWalletStatsSummary } from "@/core/app/wallet/GetWalletStatsSummary";
import type { Task } from "@/core/domain/tasks/Task";
import { Objective, sortObjectives } from "@/core/domain/objectives/Objective";
import type { ProjectHoursReport } from "@/core/domain/projects/TimeEntry";
import type { Transaction } from "@/core/domain/wallet/Transaction";
import type { WalletStatsSummary } from "@/core/domain/wallet/WalletStats";
import {
  formatDateShort,
  formatMoney,
  formatRelative,
  formatTaskDate,
  addLocalDaysISO,
  getTodayISO,
  priorityBadge,
  priorityLabel,
} from "@/lib/format";
import { getDomainConfig } from "@/lib/navigation";
import { synthesisBriefStore } from "@/lib/synthesis-brief-store";
import type { TasksEvents } from "@/ui/events/TasksEvents";
import type {
  HomeInsightTone,
  HomeMorningPlanTaskViewModel,
  HomeObjectiveViewModel,
  HomeRhythmTone,
  HomeSignalViewModel,
  HomeTodayTaskViewModel,
  HomeTrendDayViewModel,
  HomeViewModel,
  HomeWalletTransactionViewModel,
} from "@/ui/models/home/HomeViewModel";
import {
  buildDailyReviewProgress,
  buildMorningReviewSummary,
  buildWalletReviewSignals,
} from "@/ui/screens/review/daily-review-selectors";
import {
  createEmptyDailyReviewState,
  mergePersistedDailyReviewState,
} from "@/ui/screens/review/daily-review-storage";
import type { DailyReviewState } from "@/ui/screens/review/daily-review-types";
import { buildTodayProjectHoursVM } from "@/ui/screens/projects/today-project-hours";
import { buildHomeAgentBrief } from "@/ui/screens/home/home-agent-brief";

function formatInsightDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getDomainLabel(domain: string | undefined): string {
  if (!domain) return "Sistema";
  return getDomainConfig(domain)?.label ?? `${domain.charAt(0).toUpperCase()}${domain.slice(1)}`;
}

function readMetadataString(
  metadata: TaskInsightMetadata | undefined,
  key: string,
): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function inferDomainFromHref(href: string): string | undefined {
  try {
    const url = href.startsWith("http://") || href.startsWith("https://")
      ? new URL(href)
      : new URL(href, "https://vdp.local");

    return url.pathname.split("/").filter(Boolean)[0];
  } catch {
    return undefined;
  }
}

function inferDomainFromSource(source: string | undefined): string | undefined {
  return source?.split(".")[0] || undefined;
}

function resolveInsightAction(insight: TaskInsight): TaskInsightAction | undefined {
  if (insight.action) {
    return insight.action;
  }

  const href = readMetadataString(insight.metadata, "actionHref");
  const label = readMetadataString(insight.metadata, "actionLabel");

  if (!href || !label) {
    return undefined;
  }

  return {
    href,
    label,
    domain:
      readMetadataString(insight.metadata, "actionDomain") ??
      readMetadataString(insight.metadata, "domain") ??
      inferDomainFromHref(href) ??
      inferDomainFromSource(readMetadataString(insight.metadata, "source")) ??
      "tasks",
  };
}

function getTypeLabel(type: TaskInsight["type"]): string {
  switch (type) {
    case "achievement":
      return "Logro";
    case "warning":
      return "Alerta";
    case "suggestion":
      return "Sugerencia";
  }
}

function transactionTone(transaction: Transaction): "income" | "expense" | "transfer" {
  if (transaction.isIncome) return "income";
  if (transaction.isExpense) return "expense";
  return "transfer";
}

function signedAmountLabel(transaction: Transaction): string {
  if (transaction.isTransfer) {
    return formatMoney(transaction.amount, transaction.currency);
  }

  return `${transaction.isIncome ? "+" : "-"}${formatMoney(transaction.amount, transaction.currency)}`;
}

function buildRhythmSummary(carryOver: CarryOverRateResponse | null): {
  tone: HomeRhythmTone;
  message: string;
} {
  if (!carryOver || carryOver.total === 0) {
    return {
      tone: "ok",
      message: "Sin datos suficientes todavía — cargá y cerrá tareas unos días.",
    };
  }

  if (carryOver.rate > 40) {
    return {
      tone: "alert",
      message: `Arrastre alto: ${carryOver.carriedOver} de ${carryOver.total} tareas se patearon. El plan diario no está cerrando.`,
    };
  }

  if (carryOver.rate > 20) {
    return {
      tone: "watch",
      message: `Arrastre moderado: ${carryOver.carriedOver} de ${carryOver.total} tareas se patearon. Vigilalo.`,
    };
  }

  return {
    tone: "ok",
    message: `Arrastre sano: ${carryOver.carriedOver} de ${carryOver.total} tareas se patearon.`,
  };
}

function isOpenTask(task: TaskDto): boolean {
  return task.status === "pending" || task.status === "in_progress";
}

function sortPlanTasks(tasks: readonly TaskDto[]): TaskDto[] {
  return [...tasks].sort((left, right) => {
    if (left.carryOverCount !== right.carryOverCount) {
      return right.carryOverCount - left.carryOverCount;
    }
    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }
    return left.createdAt.localeCompare(right.createdAt);
  });
}

function planTaskDetail(task: TaskDto): string {
  const carryOver =
    task.carryOverCount > 0
      ? ` · ${task.carryOverCount} arrastre${task.carryOverCount === 1 ? "" : "s"}`
      : "";
  return `${priorityLabel(task.priority)}${carryOver}`;
}

function formatPlanTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sourceLabel(source: Objective["metricSource"]): string {
  return {
    manual: "Manual",
    projects_hours: "Horas de proyectos",
    tasks_completed: "Tareas completadas",
    wallet_savings: "Ahorro (Wallet)",
    health_habit_completions: "Hábito (Health)",
  }[source];
}

function formatObjectiveValue(value: number, unit: string): string {
  const formatted = value.toLocaleString("es-AR", {
    maximumFractionDigits: 1,
  });
  return `${formatted} ${unit}`;
}

export class HomePresenter extends PresenterBase<HomeViewModel> {
  private readonly today = getTodayISO();
  private readonly yesterday = addLocalDaysISO(this.today, -1);
  private reviewState: DailyReviewState = createEmptyDailyReviewState(this.today);

  private taskStats: TaskStats | null = null;
  private todayTasks: Task[] = [];
  private review: TaskReview | null = null;
  private yesterdayReview: TaskReview | null = null;
  private trend: TaskTrendDay[] = [];
  private recentInsights: TaskInsight[] = [];
  private carryOverRate: CarryOverRateResponse | null = null;
  private completionByDomain: DomainStat[] = [];
  private reviewWalletTransactions: Transaction[] = [];
  private reviewWalletByCategory: CategoryStat[] = [];
  private projectHoursReport: ProjectHoursReport | null = null;
  private objectives: Objective[] = [];
  private objectiveValues = new Map<string, number>();
  private walletStats: WalletStatsSummary | null = null;
  private walletRecentTransactions: Transaction[] = [];

  private loadingWalletStats = true;
  private loadingWalletRecentTransactions = true;
  private newTaskTitle = "";
  private creatingTask = false;
  private creatingObjectiveTaskIds = new Set<string>();
  private createTaskError: string | null = null;
  private confirmingCarryOvers = false;
  private savingFocus = false;
  private morningPlanError: string | null = null;
  private busyTaskIds = new Set<string>();

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
    private readonly events: TasksEvents,
  ) {
    super(onChange);
  }

  protected initModel(): HomeViewModel {
    return this.buildModel();
  }

  start(): void {
    this.events.tasksChanged.unsubscribe(this);
    this.events.tasksChanged.subscribe(this, () => void this.load());
    void this.load();
  }

  stop(): void {
    this.events.tasksChanged.unsubscribe(this);
    synthesisBriefStore.clearHomeBrief();
  }

  setNewTaskTitle(title: string): void {
    this.newTaskTitle = title;
    this.createTaskError = null;
    this.refresh();
  }

  async createTask(): Promise<void> {
    const title = this.newTaskTitle.trim();
    if (!title || this.creatingTask) return;

    this.creatingTask = true;
    this.createTaskError = null;
    this.refresh();

    try {
      await this.core.execute(new CreateTask({ title, priority: 2 }));
      this.newTaskTitle = "";
      await this.load();
      await this.events.emitTasksChanged();
    } catch {
      this.createTaskError = "No se pudo agregar la tarea. Probá de nuevo.";
    } finally {
      this.creatingTask = false;
      this.refresh();
    }
  }

  async createTaskForObjective(objectiveId: string): Promise<void> {
    if (this.creatingObjectiveTaskIds.has(objectiveId)) return;
    const objective = this.objectives.find((candidate) => candidate.id === objectiveId);
    if (!objective) return;

    this.creatingObjectiveTaskIds.add(objectiveId);
    this.refresh();

    try {
      await this.core.execute(new CreateTask({
        title: `Avanzar en: ${objective.title}`,
        scheduledDate: this.today,
        priority: 2,
      }));
      await this.load();
      await this.events.emitTasksChanged();
    } finally {
      this.creatingObjectiveTaskIds.delete(objectiveId);
      this.refresh();
    }
  }

  async completeTask(taskId: string): Promise<void> {
    if (this.busyTaskIds.has(taskId)) return;

    this.busyTaskIds.add(taskId);
    this.refresh();

    try {
      await this.core.execute(new CompleteTask(taskId));
      await this.load();
      await this.events.emitTasksChanged();
    } finally {
      this.busyTaskIds.delete(taskId);
      this.refresh();
    }
  }

  async confirmCarryOvers(): Promise<void> {
    if (this.confirmingCarryOvers || this.carryOverCandidates().length === 0) return;

    this.confirmingCarryOvers = true;
    this.morningPlanError = null;
    this.refresh();

    try {
      await this.core.execute(new CarryOverAll(this.yesterday, this.today));
      await this.load();
      await this.events.emitTasksChanged();
    } catch {
      this.morningPlanError = "No se pudieron traer los pendientes de ayer. Probá de nuevo.";
    } finally {
      this.confirmingCarryOvers = false;
      this.refresh();
    }
  }

  async chooseFocus(taskId: string): Promise<void> {
    if (this.savingFocus) return;
    const focus = this.focusCandidates().find((task) => task.id === taskId);
    if (!focus) return;

    this.savingFocus = true;
    this.morningPlanError = null;
    this.reviewState = {
      ...this.reviewState,
      focusTaskId: focus.id,
      plannedAt: new Date().toISOString(),
    };
    this.refresh();

    try {
      const saved = await this.core.execute(new SaveDailyReviewState(this.reviewState));
      this.reviewState = mergePersistedDailyReviewState(
        createEmptyDailyReviewState(this.today),
        saved,
      );
    } catch {
      this.morningPlanError = "No se pudo guardar el foco de hoy. Probá de nuevo.";
    } finally {
      this.savingFocus = false;
      this.refresh();
    }
  }

  private async load(): Promise<void> {
    this.loadingWalletStats = true;
    this.loadingWalletRecentTransactions = true;
    this.refresh();

    try {
      const [
        taskStats,
        todayTasks,
        review,
        yesterdayReview,
        trend,
        recentInsights,
        carryOverRate,
        completionByDomain,
        reviewWalletTransactions,
        reviewWalletByCategory,
        walletStats,
        walletRecentTransactions,
        reviewState,
        projectHoursReport,
        objectivesResult,
      ] = await Promise.all([
        this.core.execute(new GetTodayStats()),
        this.core.execute(new ListTasks({ scheduledDate: this.today, limit: "5" })),
        this.core.execute(new GetTaskReview(this.today)),
        this.core.execute(new GetTaskReview(this.yesterday)),
        this.core.execute(new GetTaskTrend(7)),
        this.core.execute(new GetRecentInsights(5)),
        this.core.execute(new GetCarryOverRate(7)),
        this.core.execute(new GetTasksByDomain()),
        this.core.execute(new GetTransactions({
          limit: "50",
          offset: "0",
          from: this.today,
          to: this.today,
        })),
        this.core.execute(new GetWalletStatsByCategory({ from: this.today, to: this.today })),
        this.core.execute(new GetWalletStatsSummary()),
        this.core.execute(new GetTransactions({ limit: "10" })),
        this.core.execute(new GetDailyReviewState(this.today)),
        this.core.execute(new GetHoursReport({ fromDate: this.today, toDate: this.today }))
          .catch(() => null),
        this.loadObjectives().catch(() => ({ objectives: [], values: new Map<string, number>() })),
      ]);

      this.reviewState = mergePersistedDailyReviewState(
        createEmptyDailyReviewState(this.today),
        reviewState,
      );
      this.taskStats = taskStats;
      this.todayTasks = todayTasks.tasks;
      this.review = review;
      this.yesterdayReview = yesterdayReview;
      this.trend = trend;
      this.recentInsights = recentInsights;
      this.carryOverRate = carryOverRate;
      this.completionByDomain = completionByDomain;
      this.reviewWalletTransactions = reviewWalletTransactions.transactions;
      this.reviewWalletByCategory = reviewWalletByCategory;
      this.projectHoursReport = projectHoursReport;
      this.objectives = objectivesResult.objectives;
      this.objectiveValues = objectivesResult.values;
      this.walletStats = walletStats;
      this.walletRecentTransactions = walletRecentTransactions.transactions;
    } catch {
      this.reviewState = createEmptyDailyReviewState(this.today);
      this.taskStats = null;
      this.todayTasks = [];
      this.review = null;
      this.yesterdayReview = null;
      this.trend = [];
      this.recentInsights = [];
      this.carryOverRate = null;
      this.completionByDomain = [];
      this.reviewWalletTransactions = [];
      this.reviewWalletByCategory = [];
      this.projectHoursReport = null;
      this.objectives = [];
      this.objectiveValues = new Map();
      this.walletStats = null;
      this.walletRecentTransactions = [];
    } finally {
      this.loadingWalletStats = false;
      this.loadingWalletRecentTransactions = false;
      this.refresh();
    }
  }

  private refresh(): void {
    const model = this.buildModel();
    this.updateModel(model);
    synthesisBriefStore.setHomeBrief(buildHomeAgentBrief(model));
    synthesisBriefStore.setHomeBriefRequested(this.reviewState.morningBriefRequestedAt !== null);
  }

  private buildModel(): HomeViewModel {
    const completed = this.taskStats?.completed ?? 0;
    const total = this.taskStats?.total ?? 0;
    const pending = this.taskStats?.pending ?? 0;
    const tasksPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const averageCompletion = this.trend.length
      ? Math.round(this.trend.reduce((acc, day) => acc + day.completionRate, 0) / this.trend.length)
      : 0;
    const todayWalletSignals = buildWalletReviewSignals({
      transactions: this.reviewWalletTransactions,
      byCategory: this.reviewWalletByCategory,
      acknowledgedSignalIds: this.reviewState.acknowledgedSignalIds,
    });
    const unresolvedInsights = this.recentInsights.filter(
      (insight) =>
        !insight.read &&
        !this.reviewState.acknowledgedSignalIds.includes(`insight:${insight.id}`),
    );
    const ritualProgress = buildDailyReviewProgress({
      pendingTasks: this.review?.pending ?? pending,
      unresolvedWalletSignals: todayWalletSignals.visibleSignals.length,
      unresolvedInsights: unresolvedInsights.length,
      moodCheckedIn: this.reviewState.completedAt !== null,
      note: this.reviewState.note,
    });
    const ritualSummary = buildMorningReviewSummary({
      watchedCategoryNames: [],
      note: this.reviewState.note,
    });

    return {
      title: "Centro de comando",
      subtitle: "Tu sistema operativo personal — un dominio a la vez",
      onlineLabel: "En línea",
      stats: {
        tasksCompleted: completed,
        tasksTotal: total,
        tasksPending: pending,
        tasksPct,
        averageCompletion,
      },
      todayTasks: {
        tasks: this.todayTasks.map((task) => this.taskVM(task)),
        newTitle: this.newTaskTitle,
        canCreate: this.newTaskTitle.trim().length > 0 && !this.creatingTask,
        isCreating: this.creatingTask,
        createError: this.createTaskError,
      },
      objectives: this.objectivesVM(),
      ritual: {
        morning: this.morningPlanVM(),
        statusLabel: this.reviewState.completedAt
          ? "Ritual cerrado"
          : this.reviewState.openedAt
            ? ritualProgress.label
            : "Listo para empezar",
        href: "/review",
        ctaLabel: this.reviewState.completedAt
          ? "Ver cierre de hoy"
          : this.reviewState.openedAt
            ? "Retomar ritual"
            : "Iniciar ritual",
        taskCount: this.review?.pending ?? pending,
        walletCount: todayWalletSignals.visibleSignals.length,
        insightCount: unresolvedInsights.length,
        noteSummary: ritualSummary || undefined,
      },
      wallet: this.walletVM(),
      signals: this.recentInsights.map((insight) => this.signalVM(insight)),
      signalCountLabel: `${this.recentInsights.length} reciente${this.recentInsights.length === 1 ? "" : "s"}`,
      trend: this.trend.map((day) => this.trendDayVM(day)),
      rhythm: this.rhythmVM(),
    };
  }

  private morningPlanVM() {
    const carryOverTasks = this.carryOverCandidates();
    const focusOptions = this.focusCandidates();
    const selectedFocus = this.selectedFocusTask();
    const plannedAtTime = formatPlanTime(this.reviewState.plannedAt);

    return {
      statusLabel: selectedFocus
        ? "Plan listo"
        : carryOverTasks.length > 0
          ? "Pendientes de ayer"
          : focusOptions.length > 0
            ? "Elegí foco"
            : "Día liviano",
      summary: selectedFocus
        ? `Foco de hoy: ${selectedFocus.title}`
        : carryOverTasks.length > 0
          ? `Confirmá ${carryOverTasks.length} pendiente${carryOverTasks.length === 1 ? "" : "s"} de ayer y después elegí el foco.`
          : focusOptions.length > 0
            ? "Sin arrastre de ayer. Elegí una tarea para proteger como foco del día."
            : "No hay tareas abiertas para planificar hoy.",
      projectHours: buildTodayProjectHoursVM(this.projectHoursReport),
      carryOverTasks: carryOverTasks.slice(0, 4).map((task) => this.morningPlanTaskVM(task)),
      carryOverCountLabel: `${carryOverTasks.length} pendiente${carryOverTasks.length === 1 ? "" : "s"}`,
      canConfirmCarryOvers: carryOverTasks.length > 0 && !this.confirmingCarryOvers,
      isConfirmingCarryOvers: this.confirmingCarryOvers,
      focusOptions: focusOptions.slice(0, 6).map((task) => this.morningPlanTaskVM(task)),
      focusTaskTitle: selectedFocus?.title ?? null,
      plannedAtLabel: plannedAtTime ? `Planificado ${plannedAtTime}` : null,
      isSavingFocus: this.savingFocus,
      error: this.morningPlanError,
    };
  }

  private morningPlanTaskVM(task: TaskDto): HomeMorningPlanTaskViewModel {
    return {
      id: task.id,
      title: task.title,
      detail: planTaskDetail(task),
      selected: this.reviewState.focusTaskId === task.id,
    };
  }

  private carryOverCandidates(): TaskDto[] {
    return sortPlanTasks((this.yesterdayReview?.pendingTasks ?? []).filter(isOpenTask));
  }

  private focusCandidates(): TaskDto[] {
    return sortPlanTasks((this.review?.pendingTasks ?? []).filter(isOpenTask));
  }

  private selectedFocusTask(): TaskDto | null {
    const focusTaskId = this.reviewState.focusTaskId;
    if (!focusTaskId) return null;
    return this.review?.allTasks.find((task) => task.id === focusTaskId) ?? null;
  }

  private async loadObjectives(): Promise<{ objectives: Objective[]; values: Map<string, number> }> {
    const objectives = sortObjectives(await this.core.execute(new ListObjectives()))
      .filter((objective) => objective.isActive);
    const values = await Promise.all(
      objectives.map(async (objective) => [objective.id, await resolveObjectiveCurrentValue(objective, this.core)] as const),
    );
    return { objectives, values: new Map(values) };
  }

  private objectivesVM() {
    const items = this.objectives.slice(0, 3).map((objective) => this.objectiveVM(objective));
    const count = this.objectives.length;
    return {
      href: "/objectives",
      countLabel: `${count} activa${count === 1 ? "" : "s"}`,
      items,
    };
  }

  private objectiveVM(objective: Objective): HomeObjectiveViewModel {
    const currentValue = this.objectiveValues.get(objective.id) ?? 0;
    const progressPercent = Math.min(100, Math.max(0, Math.round((currentValue / objective.target) * 100)));
    return {
      id: objective.id,
      title: objective.title,
      periodLabel: `${formatTaskDate(objective.periodStart)} - ${formatTaskDate(objective.periodEnd)}`,
      sourceLabel: sourceLabel(objective.metricSource),
      currentValueLabel: formatObjectiveValue(currentValue, objective.unit),
      targetValueLabel: formatObjectiveValue(objective.target, objective.unit),
      progressPercent,
      progressLabel: `${progressPercent}%`,
      isCreatingTask: this.creatingObjectiveTaskIds.has(objective.id),
    };
  }

  private taskVM(task: Task): HomeTodayTaskViewModel {
    return {
      id: task.id,
      title: task.title,
      statusTone: task.status === "done" ? "done" : "pending",
      completed: task.status === "done",
      priorityLabel: priorityLabel(task.priority),
      priorityBadgeClassName: priorityBadge(task.priority),
      scheduledDateLabel: formatDateShort(task.scheduledDate),
      busy: this.busyTaskIds.has(task.id),
    };
  }

  private walletVM() {
    const income = Number(this.walletStats?.totalIncome ?? 0);
    const expenses = Number(this.walletStats?.totalExpenses ?? 0);
    const netBalance = Number(this.walletStats?.netBalance ?? 0);
    const currency = this.walletStats?.currency ?? "ARS";
    const transactionCount = this.walletStats?.transactionCount ?? this.walletRecentTransactions.length;
    const newestTransaction = this.walletRecentTransactions.reduce<Transaction | undefined>(
      (latest, transaction) => {
        if (!latest) return transaction;
        return transaction.date > latest.date ? transaction : latest;
      },
      undefined,
    );

    return {
      isLoading: this.loadingWalletStats || this.loadingWalletRecentTransactions,
      netBalanceLabel: formatMoney(netBalance, currency),
      incomeLabel: `+${formatMoney(income, currency)}`,
      expensesLabel: `-${formatMoney(expenses, currency)}`,
      transactionCountLabel: `${transactionCount} movimientos`,
      activityLabel: newestTransaction ? formatRelative(newestTransaction.date) : "Recientes",
      recentTransactions: this.walletRecentTransactions.slice(0, 3).map((transaction) => this.transactionVM(transaction)),
    };
  }

  private transactionVM(transaction: Transaction): HomeWalletTransactionViewModel {
    return {
      id: transaction.id,
      descriptionLabel: transaction.description || transaction.type,
      dateLabel: formatDateShort(transaction.date),
      amountLabel: signedAmountLabel(transaction),
      tone: transactionTone(transaction),
    };
  }

  private signalVM(insight: TaskInsight): HomeSignalViewModel {
    const action = resolveInsightAction(insight);
    const periodFrom = readMetadataString(insight.metadata, "periodFrom");
    const periodTo = readMetadataString(insight.metadata, "periodTo");
    const domainLabel = getDomainLabel(action?.domain);

    return {
      id: insight.id,
      tone: insight.type as HomeInsightTone,
      typeLabel: getTypeLabel(insight.type),
      domainLabel,
      title: insight.title,
      message: insight.message,
      dateLabel: formatInsightDate(insight.createdAt),
      periodLabel: periodFrom && periodTo ? `Ventana: ${periodFrom} → ${periodTo}` : null,
      action: action
        ? {
          href: action.href,
          label: action.label,
          domainLabel: getDomainLabel(action.domain),
        }
        : null,
    };
  }

  private trendDayVM(day: TaskTrendDay): HomeTrendDayViewModel {
    return {
      date: day.date,
      dateLabel: day.date.slice(5),
      completionRate: day.completionRate,
      barWidth: Math.max(day.completionRate, 4),
    };
  }

  private rhythmVM() {
    const summary = buildRhythmSummary(this.carryOverRate);
    const domains = [...this.completionByDomain]
      .filter((stat) => stat.count > 0)
      .sort((left, right) => right.count - left.count)
      .slice(0, 3)
      .map((stat) => ({
        id: stat.domain || "none",
        label: stat.domain || "Sin dominio",
        countLabel: `${stat.count} completadas`,
      }));

    return {
      periodLabel: this.carryOverRate ? `últimos ${this.carryOverRate.days} días` : "últimos 7 días",
      rateLabel: this.carryOverRate ? `${this.carryOverRate.rate}%` : "—",
      tone: summary.tone,
      message: summary.message,
      domains,
    };
  }
}
