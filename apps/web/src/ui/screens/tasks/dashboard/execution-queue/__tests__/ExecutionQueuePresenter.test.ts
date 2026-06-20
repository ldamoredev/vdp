import type { Task as TaskDto } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { Task } from "@/core/domain/tasks/Task";
import { TasksEvents } from "@/ui/events/TasksEvents";
import { TasksDashboardStore } from "../../TasksDashboardStore";
import { ExecutionQueuePresenter } from "../ExecutionQueuePresenter";

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

/** The gateway contract returns domain models, so the fake maps DTOs to Tasks. */
function mockList(gateway: FakeTasksGateway, tasks: TaskDto[]) {
  vi.spyOn(gateway, "listTasks").mockResolvedValue({
    tasks: tasks.map(Task.from),
    total: tasks.length,
  });
}

async function build(tasks: TaskDto[]) {
  const gateway = new FakeTasksGateway();
  mockList(gateway, tasks);
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
    new TasksModule(gateway),
  );
  const store = new TasksDashboardStore(core, new TasksEvents(), "2026-06-13");
  await store.load();
  const presenter = new ExecutionQueuePresenter(vi.fn(), store, core);
  presenter.init(undefined);
  presenter.start();
  return { presenter, store, gateway };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("ExecutionQueuePresenter", () => {
  it("defaults to the focus filter and lists hot open tasks", async () => {
    const { presenter } = await build([
      taskDto({ id: "plain", priority: 1 }),
      taskDto({ id: "progress", status: "in_progress", priority: 2 }),
      taskDto({ id: "hot", priority: 3 }),
    ]);

    expect(presenter.model.filter).toBe("focus");
    expect(presenter.model.rows.map((r) => r.id)).toEqual(["hot", "progress"]);
  });

  it("computes filter counts across all tasks", async () => {
    const { presenter } = await build([
      taskDto({ id: "hot", priority: 3 }),
      taskDto({ id: "progress", status: "in_progress", priority: 2 }),
      taskDto({ id: "plain" }),
      taskDto({ id: "done", status: "done" }),
    ]);

    const counts = Object.fromEntries(presenter.model.filterOptions.map((o) => [o.key, o.count]));
    expect(counts).toMatchObject({ focus: 2, pending: 3, done: 1, all: 4 });
  });

  it("marks stuck task rows explicitly for the humble view", async () => {
    const { presenter } = await build([
      taskDto({ id: "stuck", carryOverCount: 3 }),
      taskDto({ id: "carried", carryOverCount: 1 }),
    ]);

    presenter.setFilter("all");

    expect(presenter.model.rows.find((row) => row.id === "stuck")?.isStuck).toBe(true);
    expect(presenter.model.rows.find((row) => row.id === "carried")?.isStuck).toBe(false);
  });

  it("switching the filter re-projects the rows", async () => {
    const { presenter } = await build([
      taskDto({ id: "hot", priority: 3 }),
      taskDto({ id: "done", status: "done" }),
    ]);

    presenter.setFilter("done");
    expect(presenter.model.filter).toBe("done");
    expect(presenter.model.rows.map((r) => r.id)).toEqual(["done"]);
  });

  it("complete dispatches the command and reloads the shared store", async () => {
    const { presenter, gateway } = await build([taskDto({ id: "hot", priority: 3 })]);
    // listTasks is spied (mockList), so assert on the spy, not the fake's recorder.
    const listCallsBefore = (gateway.listTasks as ReturnType<typeof vi.fn>).mock.calls.length;

    await presenter.complete("hot");

    expect(gateway.callsTo("completeTask")[0].args).toEqual(["hot"]);
    expect((gateway.listTasks as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
      listCallsBefore + 1,
    );
  });

  it("openDetail selects the task in the shared store", async () => {
    const { presenter, store } = await build([taskDto({ id: "hot", priority: 3 })]);

    presenter.openDetail("hot");

    expect(store.selectedId$.value).toBe("hot");
  });

  it("toggles the per-row expanded actions state", async () => {
    const { presenter } = await build([taskDto({ id: "hot", priority: 3 })]);

    presenter.setExpandedActions("hot");
    expect(presenter.model.rows[0].actionsOpen).toBe(true);

    presenter.setExpandedActions(null);
    expect(presenter.model.rows[0].actionsOpen).toBe(false);
  });

  it("re-projects when the shared store reloads", async () => {
    const { presenter, store, gateway } = await build([taskDto({ id: "hot", priority: 3 })]);
    mockList(gateway, [taskDto({ id: "hot", priority: 3 }), taskDto({ id: "new", priority: 3 })]);

    await store.load();
    await flush();

    expect(presenter.model.rows.map((r) => r.id)).toEqual(["hot", "new"]);
  });
});
