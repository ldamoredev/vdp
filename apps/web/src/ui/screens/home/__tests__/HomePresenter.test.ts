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
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { WalletModule } from "@/core/app/wallet/WalletModule";
import { FakeWalletGateway } from "@/core/app/wallet/__tests__/fakes/FakeWalletGateway";
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
  const getTodayStats = vi.spyOn(tasks, "getTodayStats").mockResolvedValue(stats());
  vi.spyOn(tasks, "listTasks").mockResolvedValue({
    tasks: [Task.from(taskDto())],
    total: 1,
  });
  vi.spyOn(tasks, "getReview").mockResolvedValue({
    date: "2026-06-15",
    total: 4,
    completed: 2,
    pending: 2,
    carriedOver: 0,
    discarded: 0,
    completionRate: 50,
    pendingTasks: [taskDto()],
    allTasks: [taskDto()],
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

  const core = new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  })
    .use(new TasksModule(tasks))
    .use(new WalletModule(wallet));
  const events = new TasksEvents();
  const presenter = new HomePresenter(vi.fn(), core, events);
  presenter.init(undefined);
  return { presenter, tasks, wallet, events, getTodayStats };
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
    const { presenter, wallet } = build();

    presenter.start();
    await flush();

    expect(presenter.model.stats.tasksCompleted).toBe(2);
    expect(presenter.model.stats.tasksPct).toBe(50);
    expect(presenter.model.todayTasks.tasks[0].title).toBe("Planificar semana");
    expect(presenter.model.ritual.taskCount).toBe(2);
    expect(presenter.model.wallet.netBalanceLabel).toBe("$ 3.800,00");
    expect(presenter.model.signals[0].title).toBe("Gasto inusual");
    expect(presenter.model.rhythm.rateLabel).toBe("20%");
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
