import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { TasksEvents } from "@/ui/events/TasksEvents";
import { TasksDashboardStore } from "../TasksDashboardStore";

function build() {
  const gateway = new FakeTasksGateway();
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
    new TasksModule(gateway),
  );
  const events = new TasksEvents();
  const store = new TasksDashboardStore(core, events, "2026-06-13");
  return { store, gateway, events };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("TasksDashboardStore", () => {
  it("loads today's tasks on start, scoped to today and execution-sorted", async () => {
    const gateway = new FakeTasksGateway();
    const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
      new TasksModule(gateway),
    );
    const store = new TasksDashboardStore(core, new TasksEvents(), "2026-06-13");

    const unsubscribe = store.start();
    await flush();

    expect(gateway.callsTo("listTasks")[0].args).toEqual([{ scheduledDate: "2026-06-13" }]);
    expect(store.isLoading$.value).toBe(false);
    unsubscribe();
  });

  it("reloads when tasksChanged fires (the chat mutated tasks)", async () => {
    const { store, gateway, events } = build();
    const unsubscribe = store.start();
    await flush();
    const before = gateway.callsTo("listTasks").length;

    await events.emitTasksChanged();
    await flush();

    expect(gateway.callsTo("listTasks").length).toBe(before + 1);
    unsubscribe();
  });

  it("stops reacting to tasksChanged after unsubscribe", async () => {
    const { store, gateway, events } = build();
    const unsubscribe = store.start();
    await flush();
    unsubscribe();
    const before = gateway.callsTo("listTasks").length;

    await events.emitTasksChanged();
    await flush();

    expect(gateway.callsTo("listTasks").length).toBe(before);
  });

  it("holds the active filter and selection", () => {
    const { store } = build();

    expect(store.filter$.value).toBe("focus");
    store.setFilter("done");
    expect(store.filter$.value).toBe("done");

    store.select("t9");
    expect(store.selectedId$.value).toBe("t9");
    store.select(undefined);
    expect(store.selectedId$.value).toBeUndefined();
  });

  it("flags the error state when the load fails", async () => {
    const gateway = new FakeTasksGateway();
    vi.spyOn(gateway, "listTasks").mockRejectedValueOnce(new Error("boom"));
    const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
      new TasksModule(gateway),
    );
    const store = new TasksDashboardStore(core, new TasksEvents(), "2026-06-13");

    await store.load();

    expect(store.error$.value).toBe(true);
  });

  it("loads the shared derivatives (stats, trend, carry-over) once per load", async () => {
    const gateway = new FakeTasksGateway();
    vi.spyOn(gateway, "getTodayStats").mockResolvedValue({
      total: 4,
      completed: 1,
      pending: 3,
      completionRate: 25,
    });
    vi.spyOn(gateway, "getTrend").mockResolvedValue([
      { date: "2026-06-13", total: 2, completed: 1, completionRate: 50 },
    ]);
    vi.spyOn(gateway, "getCarryOverRate").mockResolvedValue({ total: 10, carriedOver: 4, rate: 40, days: 7 });
    const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
      new TasksModule(gateway),
    );
    const store = new TasksDashboardStore(core, new TasksEvents(), "2026-06-13");

    await store.load();

    expect(store.todayStats$.value?.completionRate).toBe(25);
    expect(store.trend$.value).toHaveLength(1);
    expect(store.carryOverRate$.value).toBe(40);
    expect((gateway.getTodayStats as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });

  it("keeps the list usable when a derivative fails", async () => {
    const gateway = new FakeTasksGateway();
    vi.spyOn(gateway, "getCarryOverRate").mockRejectedValue(new Error("boom"));
    const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
      new TasksModule(gateway),
    );
    const store = new TasksDashboardStore(core, new TasksEvents(), "2026-06-13");

    await store.load();

    expect(store.error$.value).toBe(false);
    expect(store.carryOverRate$.value).toBe(0);
    expect(store.isLoading$.value).toBe(false);
  });
});
