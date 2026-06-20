import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { DomainStat, TaskReview, TaskTrendDay } from "@vdp/shared";
import { addDays, subDays } from "date-fns";

import type { Core } from "@/core/Core";
import { CarryOverAll } from "@/core/app/tasks/CarryOverAll";
import { CarryOverTask } from "@/core/app/tasks/CarryOverTask";
import { DiscardTask } from "@/core/app/tasks/DiscardTask";
import { GetTaskReview } from "@/core/app/tasks/GetTaskReview";
import { GetTaskTrend } from "@/core/app/tasks/GetTaskTrend";
import { GetTasksByDomain } from "@/core/app/tasks/GetTasksByDomain";
import { ListTasks } from "@/core/app/tasks/ListTasks";
import {
  buildHistoryReviewSignals,
  type HistoryReviewSignal,
  type HistoryReviewSignalTone,
} from "@/core/domain/tasks/HistoryReview";
import { Task } from "@/core/domain/tasks/Task";
import { domainBadge, domainLabel, formatDate, getTodayISO } from "@/lib/format";
import type { TasksEvents } from "@/ui/events/TasksEvents";
import type {
  HistoryClosureTaskVM,
  HistoryDomainStatsVM,
  HistoryMetricVM,
  HistorySignalVM,
  HistorySidebarTaskVM,
  HistoryTrendVM,
  HistoryViewModel,
} from "@/ui/models/tasks/HistoryViewModel";

const TREND_DAYS = 14;

const SIGNAL_COPY: Record<HistoryReviewSignal["kind"], { title: string; detail: (count?: number) => string }> = {
  clean_close: {
    title: "Cierre limpio",
    detail: () => "No quedan decisiones pendientes para este día.",
  },
  overloaded_day: {
    title: "Día sobrecargado",
    detail: () => "Conviene reprogramar solo lo rescatable y descartar el resto antes de arrastrarlo.",
  },
  recoverable_close: {
    title: "Cierre recuperable",
    detail: () => "El día no está cerrado, pero la deuda es manejable si decidís ahora qué sigue.",
  },
  stuck_tasks: {
    title: "Hay tareas bloqueadas",
    detail: (count = 0) =>
      `${count} tarea${count === 1 ? "" : "s"} arrastran demasiado carry-over y necesitan resolución explícita.`,
  },
  no_chronic_block: {
    title: "Sin bloqueo crónico",
    detail: () => "Las pendientes aún pueden moverse sin consolidar un patrón de atasco.",
  },
};

export class HistoryPresenter extends PresenterBase<HistoryViewModel> {
  private selectedDate = new Date(`${getTodayISO()}T00:00:00`);
  private review: TaskReview | null = null;
  private tasks: Task[] = [];
  private trend: TaskTrendDay[] = [];
  private domainStats: DomainStat[] = [];
  private busyIds = new Set<string>();
  private isLoading = true;
  private error = false;
  private isCarryingOverAll = false;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
    private readonly events: TasksEvents,
  ) {
    super(onChange);
  }

  protected initModel(): HistoryViewModel {
    return this.buildModel();
  }

  start(): void {
    this.events.tasksChanged.unsubscribe(this);
    this.events.tasksChanged.subscribe(this, () => void this.load());
    void this.load();
  }

  stop(): void {
    this.events.tasksChanged.unsubscribe(this);
  }

  goBack(): void {
    this.selectedDate = subDays(this.selectedDate, 1);
    void this.load();
  }

  goForward(): void {
    if (this.isToday()) return;
    this.selectedDate = addDays(this.selectedDate, 1);
    void this.load();
  }

  async carryOverTask(taskId: string): Promise<void> {
    await this.runForId(taskId, async () => {
      await this.core.execute(new CarryOverTask(taskId, this.nextReviewISO()));
      await this.load();
    });
  }

  async discardTask(taskId: string): Promise<void> {
    await this.runForId(taskId, async () => {
      await this.core.execute(new DiscardTask(taskId));
      await this.load();
    });
  }

  async carryOverAll(): Promise<void> {
    if (this.pendingTasks().length === 0 || this.isCarryingOverAll) return;
    this.isCarryingOverAll = true;
    this.refresh();
    try {
      await this.core.execute(new CarryOverAll(this.dateISO(), this.nextReviewISO()));
      await this.load();
    } finally {
      this.isCarryingOverAll = false;
      this.refresh();
    }
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      const [review, taskList, trend, domainStats] = await Promise.all([
        this.core.execute(new GetTaskReview(this.dateISO())),
        this.core.execute(new ListTasks({ scheduledDate: this.dateISO() })),
        this.core.execute(new GetTaskTrend(TREND_DAYS)),
        this.core.execute(new GetTasksByDomain()),
      ]);
      this.review = review;
      this.tasks = taskList.tasks;
      this.trend = trend;
      this.domainStats = domainStats;
      this.error = false;
    } catch {
      this.error = true;
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private async runForId(taskId: string, block: () => Promise<void>): Promise<void> {
    if (this.busyIds.has(taskId)) return;
    this.busyIds.add(taskId);
    this.refresh();
    try {
      await block();
    } finally {
      this.busyIds.delete(taskId);
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): HistoryViewModel {
    const pendingTasks = this.pendingTasks();
    const completedTasks = this.tasks.filter((task) => task.isDone);
    const discardedTasks = this.tasks.filter((task) => task.status === "discarded");

    return {
      header: {
        eyebrow: "Revisión de decisiones",
        title: "Cerrá el día con decisiones, no solo con métricas",
        description:
          "Revisá qué quedó pendiente, decidí qué se mueve y cortá el arrastre antes de que se convierta en ruido operativo.",
        dateLabel: formatDate(this.selectedDate, "EEEE, d MMM yyyy"),
        isToday: this.isToday(),
        metrics: this.headerMetrics(),
      },
      signals: this.signals(pendingTasks),
      closureQueue: {
        title: "Cola de cierre",
        description: "Cada tarea pendiente necesita una decisión: moverla o cerrarla.",
        nextDateLabel: formatDate(this.nextReviewDate(), "EEE d MMM"),
        canCarryOverAll: pendingTasks.length > 0 && !this.isCarryingOverAll,
        isCarryingOverAll: this.isCarryingOverAll,
        emptyState:
          pendingTasks.length === 0
            ? {
                title: "No quedan tareas abiertas para este día.",
                description:
                  "El review ya está resuelto. Solo queda observar el patrón y seguir con el siguiente bloque.",
              }
            : null,
        items: pendingTasks.map((task) => this.closureTaskVM(task)),
      },
      sidebar: {
        status: {
          title: "Estado del cierre",
          metrics: this.sidebarMetrics(),
        },
        completed: {
          title: "Completadas",
          count: completedTasks.length,
          emptyText: "No hubo cierres en este día.",
          items: completedTasks.map((task) => this.sidebarTaskVM(task)),
        },
        discarded: {
          title: "Descartadas",
          count: discardedTasks.length,
          emptyText: "No hubo descartes en este día.",
          items: discardedTasks.map((task) => this.sidebarTaskVM(task)),
        },
      },
      trend: this.trend.length > 0 ? this.trendVM() : null,
      domainStats: this.domainStats.length > 0 ? this.domainStatsVM() : null,
      isLoading: this.isLoading,
      error: this.error,
    };
  }

  private headerMetrics(): HistoryMetricVM[] {
    const review = this.review;
    return [
      { label: "Total", value: String(review?.total ?? 0), className: "border-[var(--glass-border)] bg-[var(--hover-overlay)]" },
      { label: "Completadas", value: String(review?.completed ?? 0), className: "border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)]" },
      { label: "Pendientes", value: String(review?.pending ?? 0), className: "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)]" },
      { label: "Tasa", value: `${review?.completionRate ?? 0}%`, className: "border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)]" },
    ];
  }

  private sidebarMetrics(): HistoryMetricVM[] {
    const review = this.review;
    return [
      { label: "Pendientes", value: String(review?.pending ?? 0), className: "border-[var(--glass-border)] bg-[var(--hover-overlay)]" },
      { label: "Reprogramadas", value: String(review?.carriedOver ?? 0), className: "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)]" },
      { label: "Descartadas", value: String(review?.discarded ?? 0), className: "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)]" },
    ];
  }

  private signals(pendingTasks: Task[]): HistorySignalVM[] {
    if (!this.review) return [];
    return buildHistoryReviewSignals({
      pending: this.review.pending,
      completionRate: this.review.completionRate,
      pendingTasks,
    }).map((signal) => {
      const copy = SIGNAL_COPY[signal.kind];
      return {
        title: copy.title,
        detail: copy.detail(signal.count),
        toneClass: this.toneClass(signal.tone),
      };
    });
  }

  private pendingTasks(): Task[] {
    if (this.review?.pendingTasks.length) return this.review.pendingTasks.map(Task.from);
    return this.tasks.filter((task) => task.isOpen);
  }

  private closureTaskVM(task: Task): HistoryClosureTaskVM {
    return {
      id: task.id,
      title: task.title,
      priority: task.priority,
      domain: task.domain,
      carryOverCount: task.carryOverCount,
      carryOverLabel: task.carryOverCount > 0 ? `${task.carryOverCount}x` : null,
      stuckLabel: task.isStuck ? "Bloqueada" : null,
      decisionText: task.isStuck
        ? "Ya arrastra demasiada deuda. Si sigue viva, debe pasar al siguiente día con intención explícita."
        : "Todavía está abierta al final del día. Decidí ahora si merece continuar o si debe salir de la cola.",
      carryOverActionLabel: `Llevar a ${formatDate(this.nextReviewDate(), "EEE d MMM")}`,
      busy: this.busyIds.has(task.id),
    };
  }

  private sidebarTaskVM(task: Task): HistorySidebarTaskVM {
    return { id: task.id, title: task.title, priority: task.priority, domain: task.domain };
  }

  private trendVM(): HistoryTrendVM {
    const selected = this.dateISO();
    return {
      title: "Tendencia 14 días",
      description: "Cómo viene cerrando tu ejecución diaria",
      days: this.trend.slice().reverse().map((day) => ({
        date: day.date,
        dayLabel: day.date.slice(8),
        completionRateLabel: `${day.completionRate}%`,
        heightPercent: Math.max(4, day.completionRate),
        selected: day.date === selected,
      })),
    };
  }

  private domainStatsVM(): HistoryDomainStatsVM {
    return {
      title: "Por dominio",
      description: "Distribución de cierres completados",
      items: this.domainStats.map((stat) => ({
        key: stat.domain || "none",
        domain: stat.domain || null,
        domainLabel: domainLabel(stat.domain) || "Sin dominio",
        domainClassName: domainBadge(stat.domain) || "badge-muted",
        completedLabel: String(stat.count),
        totalLabel: `de ${stat.count} tareas`,
        rate: stat.count > 0 ? 100 : 0,
        rateLabel: stat.count > 0 ? "100%" : "0%",
      })),
    };
  }

  private toneClass(tone: HistoryReviewSignalTone): string {
    if (tone === "success") return "border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)]";
    if (tone === "warning") return "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)]";
    if (tone === "error") return "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)]";
    return "border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)]";
  }

  private dateISO(): string {
    return formatDate(this.selectedDate, "yyyy-MM-dd");
  }

  private nextReviewDate(): Date {
    return addDays(this.selectedDate, 1);
  }

  private nextReviewISO(): string {
    return formatDate(this.nextReviewDate(), "yyyy-MM-dd");
  }

  private isToday(): boolean {
    return this.dateISO() === getTodayISO();
  }
}
