import type {
  CategoryStat,
  Task as TaskDto,
  TaskInsight,
  TaskStats,
  TaskTrendDay,
  Transaction as TransactionDto,
  WalletStatsSummary,
} from "@vdp/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { ProjectsModule } from "@/core/app/projects/ProjectsModule";
import { FakeProjectsGateway } from "@/core/app/projects/__tests__/fakes/FakeProjectsGateway";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { WalletModule } from "@/core/app/wallet/WalletModule";
import { FakeWalletGateway } from "@/core/app/wallet/__tests__/fakes/FakeWalletGateway";
import { ProjectHoursReport } from "@/core/domain/projects/TimeEntry";
import { Task } from "@/core/domain/tasks/Task";
import { Transaction } from "@/core/domain/wallet/Transaction";
import { TasksEvents } from "@/ui/events/TasksEvents";
import { HomePresenter } from "../HomePresenter";

function taskDto(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: "t1",
    title: "Planificar semana",
    description: null,
    priority: 2,
    status: "pending",
    scheduledDate: "2026-06-15",
    domain: null,
    carryOverCount: 0,
    completedAt: null,
    createdAt: "2026-06-15T08:00:00.000Z",
    updatedAt: "2026-06-15T08:00:00.000Z",
    ...overrides,
  };
}

function transactionDto(overrides: Partial<TransactionDto> = {}): TransactionDto {
  return {
    id: "tx1",
    accountId: "a1",
    categoryId: null,
    categoryName: undefined,
    type: "expense",
    amount: "1200",
    currency: "ARS",
    description: "Cafe",
    date: "2026-06-15",
    tags: [],
    createdAt: "2026-06-15T09:00:00.000Z",
    updatedAt: "2026-06-15T09:00:00.000Z",
    ...overrides,
  };
}

function stats(overrides: Partial<TaskStats> = {}): TaskStats {
  return {
    total: 4,
    completed: 2,
    pending: 2,
    completionRate: 50,
    ...overrides,
  };
}

function trend(): TaskTrendDay[] {
  return [
    { date: "2026-06-14", total: 2, completed: 1, completionRate: 50 },
    { date: "2026-06-15", total: 4, completed: 2, completionRate: 50 },
  ];
}

function taskReview(overrides: Partial<ReturnType<typeof buildTaskReview>> = {}) {
  return buildTaskReview(overrides);
}

function buildTaskReview(overrides: Partial<{
  date: string;
  total: number;
  completed: number;
  pending: number;
  carriedOver: number;
  discarded: number;
  completionRate: number;
  pendingTasks: TaskDto[];
  allTasks: TaskDto[];
}> = {}) {
  return {
    date: "2026-06-15",
    total: 4,
    completed: 2,
    pending: 2,
    carriedOver: 0,
    discarded: 0,
    completionRate: 50,
    pendingTasks: [taskDto()],
    allTasks: [taskDto()],
    ...overrides,
  };
}

function insight(overrides: Partial<TaskInsight> = {}): TaskInsight {
  return {
    id: "i1",
    type: "warning",
    title: "Gasto inusual",
    message: "Subio cafe.",
    read: false,
    createdAt: "2026-06-15T10:00:00.000Z",
    action: { href: "/wallet", label: "Ver wallet", domain: "wallet" },
    metadata: {},
    ...overrides,
  };
}

function walletStats(overrides: Partial<WalletStatsSummary> = {}): WalletStatsSummary {
  return {
    currency: "ARS",
    totalIncome: "5000",
    totalExpenses: "1200",
    netBalance: "3800",
    transactionCount: 1,
    conversion: { rateType: "mep", rates: [] },
    ...overrides,
  };
}

function categoryStat(overrides: Partial<CategoryStat> = {}): CategoryStat {
  return {
    categoryId: "coffee",
    categoryName: "Cafe",
    currency: "ARS",
    total: 1200,
    count: 1,
    ...overrides,
  };
}

function build() {
  const tasks = new FakeTasksGateway();
  const wallet = new FakeWalletGateway();
  const projects = new FakeProjectsGateway();
  const getTodayStats = vi.spyOn(tasks, "getTodayStats").mockResolvedValue(stats());
  vi.spyOn(tasks, "listTasks").mockResolvedValue({
    tasks: [Task.from(taskDto())],
    total: 1,
  });
  vi.spyOn(tasks, "getReview").mockResolvedValue({
    ...taskReview(),
  });
  vi.spyOn(tasks, "getTrend").mockResolvedValue(trend());
  vi.spyOn(tasks, "getRecentInsights").mockResolvedValue([insight()]);
  vi.spyOn(tasks, "getCarryOverRate").mockResolvedValue({
    total: 5,
    carriedOver: 1,
    rate: 20,
    days: 7,
  });
  vi.spyOn(tasks, "getByDomain").mockResolvedValue([
    { domain: "work", count: 3 },
  ]);
  vi.spyOn(wallet, "getTransactions").mockResolvedValue({
    transactions: [Transaction.from(transactionDto())],
    total: 1,
  });
  vi.spyOn(wallet, "getStatsByCategory").mockResolvedValue([categoryStat()]);
  vi.spyOn(wallet, "getStatsSummary").mockResolvedValue(walletStats());
  vi.spyOn(projects, "getHoursReport").mockResolvedValue(ProjectHoursReport.from({
    fromDate: "2026-06-15",
    toDate: "2026-06-15",
    totalMinutes: 135,
    rows: [
      {
        clientId: "c1",
        clientName: "Acme",
        projectId: "p1",
        projectOutcome: "Client portal",
        weekStart: "2026-06-15",
        minutes: 90,
      },
      {
        clientId: null,
        clientName: null,
        projectId: "p2",
        projectOutcome: "Internal ops",
        weekStart: "2026-06-15",
        minutes: 45,
      },
    ],
  }));

  const core = new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  })
    .use(new TasksModule(tasks))
    .use(new WalletModule(wallet))
    .use(new ProjectsModule(projects));
  const events = new TasksEvents();
  const presenter = new HomePresenter(vi.fn(), core, events);
  presenter.init(undefined);
  return { presenter, tasks, wallet, projects, events, getTodayStats };
}

async function flush() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

describe("HomePresenter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads command center data into the view model", async () => {
    const { presenter, wallet, projects } = build();

    presenter.start();
    await flush();

    expect(presenter.model.stats.tasksCompleted).toBe(2);
    expect(presenter.model.stats.tasksPct).toBe(50);
    expect(presenter.model.todayTasks.tasks[0].title).toBe("Planificar semana");
    expect(presenter.model.ritual.taskCount).toBe(2);
    expect(presenter.model.wallet.netBalanceLabel).toBe("$ 3.800,00");
    expect(presenter.model.signals[0].title).toBe("Gasto inusual");
    expect(presenter.model.rhythm.rateLabel).toBe("20%");
    expect(presenter.model.ritual.morning.projectHours.totalLabel).toBe("2h 15m");
    expect(presenter.model.ritual.morning.projectHours.rows.map((row) => row.projectOutcome)).toEqual([
      "Client portal",
      "Internal ops",
    ]);
    expect(projects.getHoursReport).toHaveBeenCalledWith({
      fromDate: "2026-06-15",
      toDate: "2026-06-15",
    });
    expect(wallet.getTransactions).toHaveBeenCalledWith({
      limit: "50",
      offset: "0",
      from: "2026-06-15",
      to: "2026-06-15",
    });
    expect(wallet.getTransactions).toHaveBeenCalledWith({ limit: "10" });
    presenter.stop();
  });

  it("creates a task, reloads home data and emits tasksChanged", async () => {
    const { presenter, tasks, events, getTodayStats } = build();
    const createTask = vi.spyOn(tasks, "createTask").mockResolvedValue(
      Task.from(taskDto({ id: "created", title: "Comprar cafe" })),
    );
    const emit = vi.spyOn(events, "emitTasksChanged");

    presenter.setNewTaskTitle("  Comprar cafe  ");
    await presenter.createTask();

    expect(createTask).toHaveBeenCalledWith({ title: "Comprar cafe", priority: 2 });
    expect(presenter.model.todayTasks.newTitle).toBe("");
    expect(emit).toHaveBeenCalled();
    expect(getTodayStats).toHaveBeenCalledTimes(1);
    presenter.stop();
  });

  it("marks a task as complete with a busy flag, then reloads and emits tasksChanged", async () => {
    const { presenter, tasks, events } = build();
    const pending = new Promise<Task>((resolve) => {
      setTimeout(() => resolve(Task.from(taskDto({ status: "done" }))), 10);
    });
    vi.spyOn(tasks, "completeTask").mockReturnValue(pending);
    const emit = vi.spyOn(events, "emitTasksChanged");
    presenter.start();
    await flush();

    const completion = presenter.completeTask("t1");

    expect(presenter.model.todayTasks.tasks[0].busy).toBe(true);
    await vi.advanceTimersByTimeAsync(10);
    await completion;

    expect(tasks.completeTask).toHaveBeenCalledWith("t1");
    expect(emit).toHaveBeenCalled();
    expect(presenter.model.todayTasks.tasks[0].busy).toBe(false);
    presenter.stop();
  });

  it("confirms yesterday carry-overs and persists today's focus", async () => {
    const { presenter, tasks, events } = build();
    const yesterdayTask = taskDto({
      id: "yesterday-1",
      title: "Mover factura",
      scheduledDate: "2026-06-14",
      carryOverCount: 1,
    });
    const focusTask = taskDto({
      id: "focus-1",
      title: "Enviar propuesta",
      scheduledDate: "2026-06-15",
      priority: 3,
    });
    vi.spyOn(tasks, "getReview").mockImplementation(async (date?: string) => {
      if (date === "2026-06-14") {
        return taskReview({
          date: "2026-06-14",
          total: 1,
          completed: 0,
          pending: 1,
          pendingTasks: [yesterdayTask],
          allTasks: [yesterdayTask],
        });
      }

      return taskReview({
        date: "2026-06-15",
        total: 1,
        completed: 0,
        pending: 1,
        pendingTasks: [focusTask],
        allTasks: [focusTask],
      });
    });
    const carryOverAll = vi.spyOn(tasks, "carryOverAll").mockResolvedValue({
      carriedOver: 1,
      tasks: [Task.from({ ...yesterdayTask, scheduledDate: "2026-06-15", carryOverCount: 2 })],
    });
    const saveReviewState = vi.spyOn(tasks, "saveReviewState");
    const emit = vi.spyOn(events, "emitTasksChanged");

    presenter.start();
    await flush();

    expect(presenter.model.ritual.morning.carryOverTasks[0].title).toBe("Mover factura");

    await presenter.confirmCarryOvers();

    expect(carryOverAll).toHaveBeenCalledWith("2026-06-14", "2026-06-15");
    expect(emit).toHaveBeenCalled();

    await presenter.chooseFocus("focus-1");

    expect(saveReviewState).toHaveBeenLastCalledWith(expect.objectContaining({
      date: "2026-06-15",
      focusTaskId: "focus-1",
      plannedAt: "2026-06-15T12:00:00.000Z",
    }));
    expect(presenter.model.ritual.morning.statusLabel).toBe("Plan listo");
    expect(presenter.model.ritual.morning.focusTaskTitle).toBe("Enviar propuesta");
    presenter.stop();
  });

  it("stops reacting to shared task changes", async () => {
    const { presenter, events, getTodayStats } = build();
    presenter.start();
    await flush();
    presenter.stop();
    const callsBefore = getTodayStats.mock.calls.length;

    await events.emitTasksChanged();
    await flush();

    expect(getTodayStats).toHaveBeenCalledTimes(callsBefore);
  });

  it("keeps a stable model when loading fails", async () => {
    const { presenter, tasks } = build();
    vi.spyOn(tasks, "listTasks").mockRejectedValue(new Error("unauthorized"));

    presenter.start();
    await flush();

    expect(presenter.model.todayTasks.tasks).toEqual([]);
    expect(presenter.model.wallet.isLoading).toBe(false);
    presenter.stop();
  });
});
