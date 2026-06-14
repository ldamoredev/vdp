import type { Task as TaskDto } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { Task } from "@/core/domain/tasks/Task";
import { TasksEvents } from "@/ui/events/TasksEvents";
import { TasksDashboardStore } from "../../TasksDashboardStore";
import { PlanningSignalPresenter } from "../PlanningSignalPresenter";

function taskDto(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: "t1",
    title: "Tarea",
    description: null,
    priority: 1,
    status: "pending",
    scheduledDate: "2026-06-13",
    domain: null,
    carryOverCount: 0,
    completedAt: null,
    createdAt: "2026-06-13T08:00:00.000Z",
    updatedAt: "2026-06-13T08:00:00.000Z",
    ...overrides,
  };
}

async function build(tasks: TaskDto[], carryOverRate = 0) {
  const gateway = new FakeTasksGateway();
  mockList(gateway, tasks);
  const getCarryOverRate = vi.spyOn(gateway, "getCarryOverRate").mockResolvedValue({
    total: 10,
    carriedOver: carryOverRate,
    rate: carryOverRate,
    days: 7,
  });
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
    new TasksModule(gateway),
  );
  const store = new TasksDashboardStore(core, new TasksEvents(), "2026-06-13");
  await store.load();
  const presenter = new PlanningSignalPresenter(vi.fn(), store, core);
  presenter.init(undefined);
  presenter.start();
  await flush();
  return { presenter, store, gateway, getCarryOverRate };
}

function mockList(gateway: FakeTasksGateway, tasks: TaskDto[]) {
  vi.spyOn(gateway, "listTasks").mockResolvedValue({
    tasks: tasks.map(Task.from),
    total: tasks.length,
  });
}

function defer<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("PlanningSignalPresenter", () => {
  it("loads carry-over rate and projects Spanish planning copy", async () => {
    const { presenter, getCarryOverRate } = await build([taskDto({ priority: 3 })], 40);

    expect(getCarryOverRate).toHaveBeenCalledWith(7);
    expect(presenter.model.tone).toBe("warning");
    expect(presenter.model.headline).toBe("Plan con presion");
    expect(presenter.model.summary).toContain("Todavia es recuperable");
    expect(presenter.model.metrics).toEqual([
      { label: "Pendientes", value: "1" },
      { label: "Calientes", value: "1" },
      { label: "Carry 7d", value: "40%" },
    ]);
    expect(presenter.model.recommendations[1]).toContain("40%");
  });

  it("exposes loading while carry-over rate is pending", async () => {
    const gateway = new FakeTasksGateway();
    mockList(gateway, [taskDto()]);
    const pending = defer<{ total: number; carriedOver: number; rate: number; days: number }>();
    vi.spyOn(gateway, "getCarryOverRate").mockReturnValue(pending.promise);
    const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
      new TasksModule(gateway),
    );
    const store = new TasksDashboardStore(core, new TasksEvents(), "2026-06-13");
    await store.load();
    const presenter = new PlanningSignalPresenter(vi.fn(), store, core);
    presenter.init(undefined);

    presenter.start();

    expect(presenter.model.isLoading).toBe(true);
    pending.resolve({ total: 1, carriedOver: 0, rate: 0, days: 7 });
    await flush();
    expect(presenter.model.isLoading).toBe(false);
  });

  it("re-projects when the shared task list changes", async () => {
    const { presenter, store, gateway } = await build([taskDto({ id: "plain" })]);

    expect(presenter.model.tone).toBe("info");
    mockList(gateway, Array.from({ length: 8 }, (_, index) => taskDto({ id: `t${index}` })));
    await store.load();
    await flush();

    expect(presenter.model.tone).toBe("error");
    expect(presenter.model.metrics[0].value).toBe("8");
  });

  it("unsubscribes on stop and can start again", async () => {
    const { presenter, store, gateway } = await build([taskDto({ id: "plain" })]);

    presenter.stop();
    mockList(gateway, Array.from({ length: 8 }, (_, index) => taskDto({ id: `stopped-${index}` })));
    await store.load();
    await flush();

    expect(presenter.model.tone).toBe("info");

    presenter.start();
    await flush();
    mockList(gateway, Array.from({ length: 8 }, (_, index) => taskDto({ id: `started-${index}` })));
    await store.load();
    await flush();

    expect(presenter.model.tone).toBe("error");
  });

  it("keeps a usable model when carry-over rate fails", async () => {
    const gateway = new FakeTasksGateway();
    mockList(gateway, [taskDto()]);
    vi.spyOn(gateway, "getCarryOverRate").mockRejectedValue(new Error("boom"));
    const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
      new TasksModule(gateway),
    );
    const store = new TasksDashboardStore(core, new TasksEvents(), "2026-06-13");
    await store.load();
    const presenter = new PlanningSignalPresenter(vi.fn(), store, core);
    presenter.init(undefined);
    presenter.start();
    await flush();

    expect(presenter.model.isLoading).toBe(false);
    expect(presenter.model.metrics[2].value).toBe("0%");
    expect(presenter.model.recommendations[1]).toContain("bajo control");
  });
});
