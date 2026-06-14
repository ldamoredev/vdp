import type { Task as TaskDto } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { Task } from "@/core/domain/tasks/Task";
import { TasksEvents } from "@/ui/events/TasksEvents";
import { TasksDashboardStore } from "../../TasksDashboardStore";
import { SidebarCardsPresenter } from "../SidebarCardsPresenter";

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
  vi.spyOn(gateway, "getTodayStats").mockResolvedValue({
    total: 5,
    completed: 2,
    pending: 3,
    completionRate: 40,
  });
  vi.spyOn(gateway, "getTrend").mockResolvedValue([
    { date: "2026-06-11", total: 2, completed: 1, completionRate: 50 },
    { date: "2026-06-12", total: 4, completed: 4, completionRate: 100 },
    { date: "2026-06-13", total: 5, completed: 2, completionRate: 40 },
  ]);
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
    new TasksModule(gateway),
  );
  const store = new TasksDashboardStore(core, new TasksEvents(), "2026-06-13");
  await store.load();
  const presenter = new SidebarCardsPresenter(vi.fn(), store, "2026-06-13");
  presenter.init(undefined);
  presenter.start();
  await flush();
  return { presenter, store, gateway };
}

function mockList(gateway: FakeTasksGateway, tasks: TaskDto[]) {
  vi.spyOn(gateway, "listTasks").mockResolvedValue({
    tasks: tasks.map(Task.from),
    total: tasks.length,
  });
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("SidebarCardsPresenter", () => {
  it("projects the next best action from the visible focus queue", async () => {
    const { presenter } = await build([
      taskDto({ id: "plain", title: "Ordenar inbox", priority: 1 }),
      taskDto({ id: "hot", title: "Cerrar pago", priority: 3, domain: "wallet" }),
    ]);

    expect(presenter.model.nextBestAction.title).toBe("Siguiente mejor accion");
    expect(presenter.model.nextBestAction.task).toMatchObject({
      id: "hot",
      title: "Cerrar pago",
      priority: 3,
      domain: "wallet",
      eyebrow: "En foco",
      reason: "Es la pieza con mayor impacto inmediato segun prioridad y arrastre.",
    });
  });

  it("falls back to a pending task when the active filter has no visible rows", async () => {
    const { presenter, store } = await build([taskDto({ id: "plain", title: "Ordenar inbox", priority: 1 })]);

    store.setFilter("done");

    expect(presenter.model.nextBestAction.task?.id).toBe("plain");
  });

  it("shows empty copy when there are no tasks", async () => {
    const { presenter } = await build([]);

    expect(presenter.model.nextBestAction.task).toBeNull();
    expect(presenter.model.nextBestAction.emptyText).toBe("No hay tareas cargadas para hoy.");
  });

  it("projects recovery metrics from stats and stuck tasks from the shared list", async () => {
    const { presenter } = await build([
      taskDto({ id: "plain" }),
      taskDto({ id: "carried", carryOverCount: 1 }),
      taskDto({ id: "stuck", carryOverCount: 3 }),
      taskDto({ id: "done", status: "done", carryOverCount: 4 }),
    ]);

    expect(presenter.model.recovery.metrics).toEqual([
      {
        label: "Pendientes",
        value: "3",
        className: "border-[var(--glass-border)] bg-[var(--hover-overlay)]",
      },
      {
        label: "Con carry-over",
        value: "2",
        className: "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)]",
      },
      {
        label: "Bloqueadas",
        value: "1",
        className: "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)]",
      },
    ]);
  });

  it("projects weekly rhythm with reversed trend and today's highlight", async () => {
    const { presenter, gateway } = await build([]);

    expect(gateway.getTrend).toHaveBeenCalledWith(7);
    expect(presenter.model.weeklyRhythm.days.map((day) => day.dateLabel)).toEqual([
      "06-13",
      "06-12",
      "06-11",
    ]);
    expect(presenter.model.weeklyRhythm.days[0]).toMatchObject({
      completionRateLabel: "40%",
      heightPercent: 40,
      today: true,
    });
    expect(presenter.model.weeklyRhythm.emptyText).toBeNull();
  });

  it("keeps usable fallback state when stats and trend fail", async () => {
    const gateway = new FakeTasksGateway();
    mockList(gateway, [taskDto({ id: "p", carryOverCount: 1 })]);
    vi.spyOn(gateway, "getTodayStats").mockRejectedValue(new Error("boom"));
    vi.spyOn(gateway, "getTrend").mockRejectedValue(new Error("boom"));
    const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
      new TasksModule(gateway),
    );
    const store = new TasksDashboardStore(core, new TasksEvents(), "2026-06-13");
    await store.load();
    const presenter = new SidebarCardsPresenter(vi.fn(), store, "2026-06-13");
    presenter.init(undefined);
    presenter.start();
    await flush();

    expect(presenter.model.recovery.metrics[0].value).toBe("1");
    expect(presenter.model.weeklyRhythm.days).toEqual([]);
    expect(presenter.model.weeklyRhythm.emptyText).toBe("Todavia no hay tendencia suficiente.");
  });

  it("unsubscribes from the shared store on stop and can start again", async () => {
    const { presenter, store, gateway } = await build([taskDto({ id: "hot", priority: 3 })]);

    presenter.stop();
    mockList(gateway, [taskDto({ id: "stopped", priority: 3 })]);
    await store.load();
    await flush();

    expect(presenter.model.nextBestAction.task?.id).toBe("hot");

    presenter.start();
    await flush();
    mockList(gateway, [taskDto({ id: "started", priority: 3 })]);
    await store.load();
    await flush();

    expect(presenter.model.nextBestAction.task?.id).toBe("started");
  });
});
