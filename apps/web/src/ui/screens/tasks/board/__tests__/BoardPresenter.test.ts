import type { Task as TaskDto } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { Task } from "@/core/domain/tasks/Task";
import { TasksEvents } from "@/ui/events/TasksEvents";
import { BoardPresenter } from "../BoardPresenter";

function taskDto(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: "t1",
    title: "Tarea",
    description: null,
    priority: 1,
    status: "pending",
    scheduledDate: "2026-06-13",
    domain: "wallet",
    carryOverCount: 0,
    completedAt: null,
    createdAt: "2026-06-13T08:00:00.000Z",
    updatedAt: "2026-06-13T08:00:00.000Z",
    ...overrides,
  };
}

function mockList(gateway: FakeTasksGateway, tasks: TaskDto[]) {
  vi.spyOn(gateway, "listTasks").mockResolvedValue({ tasks: tasks.map(Task.from), total: tasks.length });
}

async function build(tasks: TaskDto[]) {
  const gateway = new FakeTasksGateway();
  mockList(gateway, tasks);
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
    new TasksModule(gateway),
  );
  const presenter = new BoardPresenter(vi.fn(), core, new TasksEvents(), "wallet");
  presenter.init(undefined);
  await presenter.reload();
  return { presenter, gateway };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("BoardPresenter", () => {
  it("groups the domain tasks into pending/done/discarded columns (all scope by default)", async () => {
    const { presenter } = await build([
      taskDto({ id: "p", status: "pending" }),
      taskDto({ id: "d", status: "done" }),
      taskDto({ id: "x", status: "discarded" }),
    ]);

    expect(presenter.model.scope).toBe("all");
    expect(presenter.model.columns.map((c) => c.id)).toEqual(["pending", "done", "discarded"]);
    const counts = Object.fromEntries(presenter.model.columns.map((c) => [c.id, c.count]));
    expect(counts).toEqual({ pending: 1, done: 1, discarded: 1 });
  });

  it("reads the domain from the query so the board is module-scoped", async () => {
    const { gateway } = await build([]);
    expect((gateway.listTasks as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({ domain: "wallet" });
  });

  it("active scope collapses to the pending column only", async () => {
    const { presenter } = await build([taskDto({ id: "p" }), taskDto({ id: "d", status: "done" })]);

    presenter.setScope("active");

    expect(presenter.model.columns.map((c) => c.id)).toEqual(["pending"]);
  });

  it("marks a stuck pending task but never a terminal one", async () => {
    const { presenter } = await build([
      taskDto({ id: "stuck", status: "pending", carryOverCount: 3 }),
      taskDto({ id: "olddone", status: "done", carryOverCount: 5 }),
    ]);

    const pending = presenter.model.columns.find((c) => c.id === "pending")!;
    const done = presenter.model.columns.find((c) => c.id === "done")!;
    expect(pending.tasks[0].isStuck).toBe(true);
    expect(done.tasks[0].isStuck).toBe(false);
  });

  it("dropping a pending card on Hechas completes it and reloads", async () => {
    const { presenter, gateway } = await build([taskDto({ id: "p", status: "pending" })]);
    const listBefore = (gateway.listTasks as ReturnType<typeof vi.fn>).mock.calls.length;

    presenter.startDrag("p");
    presenter.drop("done");
    await flush();

    expect(gateway.callsTo("completeTask")[0].args).toEqual(["p"]);
    expect((gateway.listTasks as ReturnType<typeof vi.fn>).mock.calls.length).toBe(listBefore + 1);
  });

  it("dropping a pending card on Descartadas discards it", async () => {
    const { presenter, gateway } = await build([taskDto({ id: "p", status: "pending" })]);

    presenter.startDrag("p");
    presenter.drop("discarded");
    await flush();

    expect(gateway.callsTo("discardTask")[0].args).toEqual(["p"]);
  });

  it("dropping a terminal card back on Pendientes is a no-op (reopen unsupported)", async () => {
    const { presenter, gateway } = await build([taskDto({ id: "d", status: "done" })]);

    presenter.startDrag("d");
    presenter.drop("pending");
    await flush();

    expect(gateway.callsTo("completeTask")).toHaveLength(0);
    expect(gateway.callsTo("carryOverTask")).toHaveLength(0);
    expect(gateway.callsTo("discardTask")).toHaveLength(0);
  });

  it("submitting the composer creates a task tagged with the domain and reloads", async () => {
    const { presenter, gateway } = await build([]);

    presenter.openComposer();
    presenter.setComposerTitle("Pagar tarjeta");
    presenter.setComposerPriority(3);
    await presenter.submitComposer();

    expect(gateway.callsTo("createTask")[0].args).toEqual([
      { title: "Pagar tarjeta", priority: 3, domain: "wallet" },
    ]);
    expect(presenter.model.composer).toBeNull();
  });

  it("defaults the mobile column to pending and switches it", async () => {
    const { presenter } = await build([taskDto({ id: "d", status: "done" })]);

    expect(presenter.model.mobileColumnId).toBe("pending");
    presenter.setMobileColumn("done");
    expect(presenter.model.mobileColumnId).toBe("done");
  });

  it("clamps the mobile column to a visible one when the scope hides it", async () => {
    const { presenter } = await build([taskDto({ id: "d", status: "done" })]);

    presenter.setMobileColumn("done");
    presenter.setScope("active");

    expect(presenter.model.mobileColumnId).toBe("pending");
  });
});
