import type { DomainStat, Task as TaskDto, TaskReview, TaskTrendDay } from "@vdp/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { Task } from "@/core/domain/tasks/Task";
import { HistoryPresenter } from "../HistoryPresenter";

function taskDto(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: "t1",
    title: "Cerrar review",
    description: null,
    priority: 2,
    status: "pending",
    scheduledDate: "2026-06-14",
    domain: null,
    carryOverCount: 0,
    completedAt: null,
    createdAt: "2026-06-14T08:00:00.000Z",
    updatedAt: "2026-06-14T08:00:00.000Z",
    ...overrides,
  };
}

function review(overrides: Partial<TaskReview> = {}): TaskReview {
  const pending = taskDto({ id: "pending", title: "Resolver cierre", carryOverCount: 3 });
  const done = taskDto({ id: "done", title: "Enviar resumen", status: "done" });
  const discarded = taskDto({ id: "discarded", title: "Tirar ruido", status: "discarded" });
  return {
    date: "2026-06-14",
    total: 3,
    completed: 1,
    pending: 1,
    carriedOver: 0,
    discarded: 1,
    completionRate: 33,
    pendingTasks: [pending],
    allTasks: [pending, done, discarded],
    ...overrides,
  };
}

function build({
  reviewResult = review(),
  tasks = reviewResult.allTasks,
  trend = [
    { date: "2026-06-13", total: 2, completed: 1, completionRate: 50 },
    { date: "2026-06-14", total: 3, completed: 1, completionRate: 33 },
  ],
  domainStats = [{ domain: "work", count: 2 }],
}: {
  reviewResult?: TaskReview;
  tasks?: TaskDto[];
  trend?: TaskTrendDay[];
  domainStats?: DomainStat[];
} = {}) {
  const gateway = new FakeTasksGateway();
  const listTasks = vi.spyOn(gateway, "listTasks").mockResolvedValue({
    tasks: tasks.map(Task.from),
    total: tasks.length,
  });
  const getReview = vi.spyOn(gateway, "getReview").mockResolvedValue(reviewResult);
  const getTrend = vi.spyOn(gateway, "getTrend").mockResolvedValue(trend);
  const getByDomain = vi.spyOn(gateway, "getByDomain").mockResolvedValue(domainStats);
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
    new TasksModule(gateway),
  );
  const presenter = new HistoryPresenter(vi.fn(), core);
  presenter.init(undefined);
  return { presenter, gateway, listTasks, getReview, getTrend, getByDomain };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function flush() {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
}

describe("HistoryPresenter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T12:00:00.000-03:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads the selected day review, tasks, trend, and domain stats", async () => {
    const { presenter, listTasks, getReview, getTrend, getByDomain } = build();

    presenter.start();
    await flush();

    expect(getReview).toHaveBeenCalledWith("2026-06-14");
    expect(listTasks).toHaveBeenCalledWith({ scheduledDate: "2026-06-14" });
    expect(getTrend).toHaveBeenCalledWith(14);
    expect(getByDomain).toHaveBeenCalledWith(undefined);
    expect(presenter.model.header.dateLabel).toBe("domingo, 14 jun 2026");
    expect(presenter.model.header.metrics.map((metric) => metric.value)).toEqual(["3", "1", "1", "33%"]);
    expect(presenter.model.signals.map((signal) => signal.title)).toEqual([
      "Dia sobrecargado",
      "Hay tareas bloqueadas",
    ]);
    expect(presenter.model.closureQueue.items.map((item) => item.title)).toEqual(["Resolver cierre"]);
    expect(presenter.model.sidebar.completed.items.map((item) => item.title)).toEqual(["Enviar resumen"]);
    expect(presenter.model.sidebar.discarded.items.map((item) => item.title)).toEqual(["Tirar ruido"]);
    expect(presenter.model.trend?.days.map((day) => day.selected)).toEqual([true, false]);
    expect(presenter.model.domainStats?.items[0].rateLabel).toBe("100%");
  });

  it("navigates back and does not navigate forward past today", async () => {
    const { presenter, getReview } = build();
    presenter.start();
    await flush();

    presenter.goForward();
    await flush();
    expect(getReview).toHaveBeenCalledTimes(1);

    presenter.goBack();
    await flush();

    expect(presenter.model.header.isToday).toBe(false);
    expect(getReview).toHaveBeenLastCalledWith("2026-06-13");

    presenter.goForward();
    await flush();
    expect(presenter.model.header.isToday).toBe(true);
    expect(getReview).toHaveBeenLastCalledWith("2026-06-14");
  });

  it("carries over a task to the next review day and exposes item busy state", async () => {
    const { presenter, gateway, listTasks } = build();
    const carryOver = deferred<Task>();
    vi.spyOn(gateway, "carryOverTask").mockReturnValue(carryOver.promise);
    presenter.start();
    await flush();

    const action = presenter.carryOverTask("pending");
    await flush();

    expect(presenter.model.closureQueue.items[0].busy).toBe(true);
    expect(gateway.carryOverTask).toHaveBeenCalledWith("pending", "2026-06-15");

    carryOver.resolve(Task.from(taskDto({ id: "pending", scheduledDate: "2026-06-15" })));
    await action;
    await flush();

    expect(presenter.model.closureQueue.items[0].busy).toBe(false);
    expect(listTasks).toHaveBeenLastCalledWith({ scheduledDate: "2026-06-14" });
  });

  it("carries over every pending task to the next review day", async () => {
    const { presenter, gateway } = build();
    const execute = vi.spyOn(gateway, "carryOverAll").mockResolvedValue({ carriedOver: 1, tasks: [] });
    presenter.start();
    await flush();

    await presenter.carryOverAll();

    expect(execute).toHaveBeenCalledWith("2026-06-14", "2026-06-15");
    expect(presenter.model.closureQueue.isCarryingOverAll).toBe(false);
  });
});
