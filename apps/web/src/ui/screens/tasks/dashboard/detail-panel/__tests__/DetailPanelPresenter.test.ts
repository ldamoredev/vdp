import type { Task as TaskDto } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { Task } from "@/core/domain/tasks/Task";
import type { TaskNote } from "@/core/domain/tasks/TaskNote";
import { TasksEvents } from "@/ui/events/TasksEvents";
import { TasksDashboardStore } from "../../TasksDashboardStore";
import { DetailPanelPresenter } from "../DetailPanelPresenter";

function taskDto(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: "t1",
    title: "Preparar demo",
    description: null,
    priority: 2,
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

function note(overrides: Partial<TaskNote> = {}): TaskNote {
  return {
    id: "n1",
    taskId: "t1",
    content: "nota",
    type: "note",
    createdAt: "2026-06-13T08:00:00.000Z",
    ...overrides,
  };
}

async function build(tasks: TaskDto[], notes: TaskNote[] = []) {
  const gateway = new FakeTasksGateway();
  mockList(gateway, tasks);
  mockDetails(gateway, tasks, notes);
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
    new TasksModule(gateway),
  );
  const store = new TasksDashboardStore(core, new TasksEvents(), "2026-06-13");
  await store.load();
  const presenter = new DetailPanelPresenter(vi.fn(), store, core);
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

function mockDetails(gateway: FakeTasksGateway, tasks: TaskDto[], notes: TaskNote[]) {
  vi.spyOn(gateway, "getTask").mockImplementation(async (id) => ({
    task: Task.from(tasks.find((task) => task.id === id) ?? taskDto({ id })),
    notes,
  }));
  vi.spyOn(gateway, "listNotes").mockResolvedValue(notes);
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("DetailPanelPresenter", () => {
  it("selects the first focus task and loads its detail and notes", async () => {
    const { presenter, store, gateway } = await build(
      [
        taskDto({ id: "plain", priority: 1, title: "Ordenar inbox" }),
        taskDto({ id: "hot", priority: 3, title: "Cerrar pago", domain: "wallet", carryOverCount: 2 }),
      ],
      [
        note({ id: "step", taskId: "hot", content: "- Abrir banco", type: "breakdown_step" }),
        note({ id: "blocker", taskId: "hot", content: "Falta token", type: "blocker" }),
        note({ id: "note", taskId: "hot", content: "Pagar antes de las 18", type: "note" }),
      ],
    );

    expect(store.selectedId$.value).toBe("hot");
    expect(gateway.getTask).toHaveBeenCalledWith("hot");
    expect(gateway.listNotes).toHaveBeenCalledWith("hot");
    expect(presenter.model.selectedTask?.title).toBe("Cerrar pago");
    expect(presenter.model.selectedTask?.statusLabel).toBe("Activa");
    expect(presenter.model.selectedTask?.description).toContain("Sin descripcion adicional");
    expect(presenter.model.selector.items.map((item) => item.id)).toEqual(["hot", "plain"]);
    expect(presenter.model.persistedSteps.items.map((item) => item.content)).toEqual(["- Abrir banco"]);
    expect(presenter.model.blockerNotes.items.map((item) => item.content)).toEqual(["Falta token"]);
    expect(presenter.model.contextNotes.items.map((item) => item.content)).toEqual(["Pagar antes de las 18"]);
  });

  it("shows an empty state without pending tasks", async () => {
    const { presenter } = await build([]);

    expect(presenter.model.selectedTask).toBeNull();
    expect(presenter.model.emptyState?.description).toBe("Selecciona una tarea pendiente para ver su detalle.");
  });

  it("switches selection and reloads detail", async () => {
    const { presenter, store, gateway } = await build([
      taskDto({ id: "hot", priority: 3 }),
      taskDto({ id: "other", priority: 2, title: "Otra" }),
    ]);

    presenter.openDetail("other");
    await flush();

    expect(store.selectedId$.value).toBe("other");
    expect(gateway.getTask).toHaveBeenCalledWith("other");
    expect(presenter.model.selector.items.find((item) => item.id === "other")?.selected).toBe(true);
  });

  it("adds a manual breakdown step and reloads notes", async () => {
    const { presenter, gateway } = await build([taskDto({ id: "hot", priority: 3 })]);
    vi.spyOn(gateway, "addNote").mockResolvedValue(note({ id: "new", taskId: "hot", type: "breakdown_step" }));

    presenter.setBreakdownStep("Definir entregable");
    await presenter.addBreakdownStep();

    expect(gateway.addNote).toHaveBeenCalledWith("hot", "- Definir entregable", "breakdown_step");
    expect(presenter.model.breakdownForm.value).toBe("");
  });

  it("adds a suggestion step as a breakdown note", async () => {
    const { presenter, gateway } = await build([taskDto({ id: "hot", priority: 3, title: "Preparar demo" })]);
    const addNote = vi.spyOn(gateway, "addNote").mockResolvedValue(note({ id: "new", taskId: "hot" }));

    await presenter.addSuggestedStep("Anotar resultado exacto");

    expect(addNote).toHaveBeenCalledWith("hot", "Anotar resultado exacto", "breakdown_step");
  });

  it("adds a typed note and resets the note draft", async () => {
    const { presenter, gateway } = await build([taskDto({ id: "hot", priority: 3 })]);
    vi.spyOn(gateway, "addNote").mockResolvedValue(note({ id: "new", taskId: "hot", type: "blocker" }));

    presenter.setNoteValue("Falta respuesta");
    presenter.setNoteType("blocker");
    await presenter.addNote();

    expect(gateway.addNote).toHaveBeenCalledWith("hot", "Falta respuesta", "blocker");
    expect(presenter.model.noteForm.value).toBe("");
    expect(presenter.model.noteForm.type).toBe("note");
  });

  it("unsubscribes on stop and can start again", async () => {
    const { presenter, store } = await build([taskDto({ id: "hot", priority: 3 })]);

    presenter.stop();
    store.select(undefined);
    expect(presenter.model.selector.items[0].selected).toBe(true);

    presenter.start();
    await flush();
    expect(store.selectedId$.value).toBe("hot");
  });
});
