import type { Task as TaskDto } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { Task } from "@/core/domain/tasks/Task";
import { TasksEvents } from "@/ui/events/TasksEvents";
import { TasksDashboardStore } from "../../TasksDashboardStore";
import { OperationalHeaderPresenter } from "../OperationalHeaderPresenter";

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
  vi.spyOn(gateway, "listTasks").mockResolvedValue({ tasks: tasks.map(Task.from), total: tasks.length });
  vi.spyOn(gateway, "getTodayStats").mockResolvedValue({
    total: 4,
    completed: 1,
    pending: 3,
    completionRate: 25,
  });
  vi.spyOn(gateway, "getTrend").mockResolvedValue([
    { date: "2026-06-12", total: 2, completed: 2, completionRate: 100 },
    { date: "2026-06-13", total: 2, completed: 1, completionRate: 50 },
  ]);
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
    new TasksModule(gateway),
  );
  const store = new TasksDashboardStore(core, new TasksEvents(), "2026-06-13");
  await store.load();
  const presenter = new OperationalHeaderPresenter(vi.fn(), store, core, "2026-06-13");
  presenter.init(undefined);
  presenter.start();
  await flush();
  return { presenter, store, gateway };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("OperationalHeaderPresenter", () => {
  it("loads today's completion stats", async () => {
    const { presenter } = await build([]);
    expect(presenter.model.completionRate).toBe(25);
    expect(presenter.model.completed).toBe(1);
    expect(presenter.model.total).toBe(4);
  });

  it("averages the 7-day trend completion rate", async () => {
    const { presenter } = await build([]);
    expect(presenter.model.completionAverage).toBe(75);
  });

  it("derives pressure counts from the shared list", async () => {
    const { presenter } = await build([
      taskDto({ id: "stuck", carryOverCount: 3 }),
      taskDto({ id: "high", priority: 3 }),
      taskDto({ id: "progress", status: "in_progress", priority: 3 }),
      taskDto({ id: "carried", carryOverCount: 1 }),
      taskDto({ id: "plain", priority: 1 }),
      taskDto({ id: "done", status: "done" }),
    ]);

    // urgent = open with priority 3 OR carried over: stuck, high, progress, carried
    expect(presenter.model.urgentCount).toBe(4);
    expect(presenter.model.stuckCount).toBe(1);
    expect(presenter.model.highPriorityCount).toBe(2);
    expect(presenter.model.pendingCount).toBe(5);
    expect(presenter.model.doneCount).toBe(1);
    expect(presenter.model.pressureValue).toBe(1);
    expect(presenter.model.pressureSub).toBe("1 trabada, 2 alta prioridad.");
    expect(presenter.model.rhythmSub).toBe("5 pendientes, 1 cerrada.");
  });

  it("can reschedule only when there are open tasks", async () => {
    const withPending = await build([taskDto({ id: "p" })]);
    expect(withPending.presenter.model.canReschedule).toBe(true);

    const withProgress = await build([taskDto({ id: "i", status: "in_progress" })]);
    expect(withProgress.presenter.model.canReschedule).toBe(true);

    const allDone = await build([taskDto({ id: "d", status: "done" })]);
    expect(allDone.presenter.model.canReschedule).toBe(false);
  });

  it("reschedule dispatches carry-over-all for today and reloads", async () => {
    const { presenter, gateway } = await build([taskDto({ id: "p" })]);
    const listBefore = (gateway.listTasks as ReturnType<typeof vi.fn>).mock.calls.length;

    await presenter.reschedule();

    expect(gateway.callsTo("carryOverAll")[0].args).toEqual(["2026-06-13", undefined]);
    expect((gateway.listTasks as ReturnType<typeof vi.fn>).mock.calls.length).toBe(listBefore + 1);
  });
});
