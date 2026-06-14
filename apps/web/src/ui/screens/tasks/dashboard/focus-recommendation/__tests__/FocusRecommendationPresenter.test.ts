import type { Task as TaskDto } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { Task } from "@/core/domain/tasks/Task";
import { TasksEvents } from "@/ui/events/TasksEvents";
import { TasksDashboardStore } from "../../TasksDashboardStore";
import { FocusRecommendationPresenter } from "../FocusRecommendationPresenter";

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

async function build(tasks: TaskDto[]) {
  const gateway = new FakeTasksGateway();
  mockList(gateway, tasks);
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
    new TasksModule(gateway),
  );
  const store = new TasksDashboardStore(core, new TasksEvents(), "2026-06-13");
  await store.load();
  const presenter = new FocusRecommendationPresenter(vi.fn(), store);
  presenter.init(undefined);
  presenter.start();
  return { presenter, store, gateway };
}

function mockList(gateway: FakeTasksGateway, tasks: TaskDto[]) {
  vi.spyOn(gateway, "listTasks").mockResolvedValue({
    tasks: tasks.map(Task.from),
    total: tasks.length,
  });
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("FocusRecommendationPresenter", () => {
  it("shows recommended focus tasks with Spanish copy", async () => {
    const { presenter } = await build([
      taskDto({ id: "plain", title: "Ordenar inbox", priority: 1 }),
      taskDto({ id: "high", title: "Cerrar pago", priority: 3, domain: "wallet" }),
      taskDto({ id: "carried", title: "Mandar resumen", priority: 1, carryOverCount: 2 }),
      taskDto({ id: "done", title: "Hecha", status: "done", priority: 3 }),
    ]);

    expect(presenter.model.title).toBe("Focus recomendado");
    expect(presenter.model.items.map((item) => item.id)).toEqual(["carried", "high"]);
    expect(presenter.model.items[0]).toMatchObject({
      title: "Mandar resumen",
      rank: "1",
      carryOverCount: 2,
      selected: false,
      reason: "Arrastra 2 carry-over. Conviene resolverla temprano.",
    });
    expect(presenter.model.items[1].reason).toBe(
      "Tiene el mejor balance entre prioridad y urgencia para entrar en foco hoy.",
    );
    expect(presenter.model.emptyState).toBeNull();
  });

  it("shows an empty state when there is no forced focus", async () => {
    const { presenter } = await build([taskDto({ id: "plain", priority: 1 })]);

    expect(presenter.model.items).toEqual([]);
    expect(presenter.model.emptyState).toEqual({
      title: "No hay foco forzado para hoy.",
      description: "La cola esta liviana. Puedes capturar trabajo nuevo sin romper el plan.",
    });
  });

  it("selects a recommended task in the shared store", async () => {
    const { presenter, store } = await build([taskDto({ id: "high", priority: 3 })]);

    presenter.openFocus("high");

    expect(store.selectedId$.value).toBe("high");
    expect(presenter.model.items[0].selected).toBe(true);
  });

  it("re-projects when tasks or selection change", async () => {
    const { presenter, store, gateway } = await build([taskDto({ id: "high", priority: 3 })]);

    store.select("high");
    expect(presenter.model.items[0].selected).toBe(true);

    mockList(gateway, [
      taskDto({ id: "high", priority: 3 }),
      taskDto({ id: "new", priority: 3, title: "Nueva caliente" }),
    ]);
    await store.load();
    await flush();

    expect(presenter.model.items.map((item) => item.id)).toEqual(["high", "new"]);
  });

  it("unsubscribes on stop and can start again", async () => {
    const { presenter, store, gateway } = await build([taskDto({ id: "high", priority: 3 })]);

    presenter.stop();
    mockList(gateway, [taskDto({ id: "new", priority: 3 })]);
    await store.load();
    await flush();

    expect(presenter.model.items.map((item) => item.id)).toEqual(["high"]);

    presenter.start();
    await flush();
    mockList(gateway, [taskDto({ id: "again", priority: 3 })]);
    await store.load();
    await flush();

    expect(presenter.model.items.map((item) => item.id)).toEqual(["again"]);
  });
});
