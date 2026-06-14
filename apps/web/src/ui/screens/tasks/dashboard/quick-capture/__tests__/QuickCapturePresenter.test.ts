import type { Task as TaskDto } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { Task } from "@/core/domain/tasks/Task";
import { TasksEvents } from "@/ui/events/TasksEvents";
import { TasksDashboardStore } from "../../TasksDashboardStore";
import { QuickCapturePresenter } from "../QuickCapturePresenter";

function taskDto(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: "created",
    title: "Nueva",
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

function build() {
  const gateway = new FakeTasksGateway();
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
    new TasksModule(gateway),
  );
  const store = new TasksDashboardStore(core, new TasksEvents(), "2026-06-13");
  const presenter = new QuickCapturePresenter(vi.fn(), store, core);
  presenter.init(undefined);
  return { presenter, store, gateway };
}

function defer<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("QuickCapturePresenter", () => {
  it("starts with an empty form and Spanish labels", () => {
    const { presenter } = build();

    expect(presenter.model.title).toBe("");
    expect(presenter.model.priority).toBe(2);
    expect(presenter.model.domain).toBe("");
    expect(presenter.model.canCreate).toBe(false);
    expect(presenter.model.submitLabel).toBe("Agregar a hoy");
    expect(presenter.model.priorityOptions.map((option) => option.label)).toEqual([
      "Baja",
      "Media",
      "Alta",
    ]);
    expect(presenter.model.domainOptions[0]).toEqual({
      value: "",
      label: "Sin dominio",
    });
  });

  it("projects form changes into the view model", () => {
    const { presenter } = build();

    presenter.setTitle(" Revisar propuesta ");
    presenter.setPriority(3);
    presenter.setDomain("work");

    expect(presenter.model.title).toBe(" Revisar propuesta ");
    expect(presenter.model.priority).toBe(3);
    expect(presenter.model.domain).toBe("work");
    expect(presenter.model.canCreate).toBe(true);
    expect(presenter.model.priorityOptions.find((option) => option.value === 3)?.selected).toBe(true);
  });

  it("creates a trimmed task, reloads the shared store, selects it, and resets the form", async () => {
    const { presenter, store, gateway } = build();
    const created = Task.from(taskDto({ id: "new-task" }));
    vi.spyOn(gateway, "createTask").mockResolvedValue(created);
    const listCallsBefore = gateway.callsTo("listTasks").length;

    presenter.setTitle("  Preparar demo  ");
    presenter.setPriority(3);
    presenter.setDomain("work");
    await presenter.create();

    expect(gateway.createTask).toHaveBeenCalledWith({ title: "Preparar demo", priority: 3, domain: "work" });
    expect(gateway.callsTo("listTasks").length).toBe(listCallsBefore + 1);
    expect(store.selectedId$.value).toBe("new-task");
    expect(store.filter$.value).toBe("focus");
    expect(presenter.model.title).toBe("");
    expect(presenter.model.priority).toBe(2);
    expect(presenter.model.domain).toBe("");
  });

  it("does not create when the title is blank", async () => {
    const { presenter, gateway } = build();
    const createSpy = vi.spyOn(gateway, "createTask");

    presenter.setTitle("   ");
    await presenter.create();

    expect(createSpy).not.toHaveBeenCalled();
  });

  it("exposes the busy state while create is pending", async () => {
    const { presenter, gateway } = build();
    const pending = defer<Task>();
    vi.spyOn(gateway, "createTask").mockReturnValue(pending.promise);

    presenter.setTitle("Resolver alta");
    const createPromise = presenter.create();

    expect(presenter.model.isCreating).toBe(true);
    expect(presenter.model.canCreate).toBe(false);
    expect(presenter.model.submitLabel).toBe("Agregando...");

    pending.resolve(Task.from(taskDto({ id: "created" })));
    await createPromise;

    expect(presenter.model.isCreating).toBe(false);
  });

  it("keeps the draft and shows an error when create fails", async () => {
    const { presenter, gateway } = build();
    vi.spyOn(gateway, "createTask").mockRejectedValue(new Error("boom"));

    presenter.setTitle("No perder esto");
    await presenter.create();

    expect(presenter.model.title).toBe("No perder esto");
    expect(presenter.model.errorMessage).toBe("No se pudo agregar la tarea. Probá de nuevo.");
    expect(presenter.model.isCreating).toBe(false);
  });
});
