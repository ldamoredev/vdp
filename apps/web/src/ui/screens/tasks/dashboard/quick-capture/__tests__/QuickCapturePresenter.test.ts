import type { Task as TaskDto } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { Task } from "@/core/domain/tasks/Task";
import { TasksEvents } from "@/ui/events/TasksEvents";
import { TasksDashboardStore } from "../../TasksDashboardStore";
import { QuickCapturePresenter } from "../QuickCapturePresenter";

// A title concrete enough to skip the clarification gate (>3 words, not generic).
const CONCRETE_TITLE = "Enviar presupuesto corregido al cliente";

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
    expect(presenter.model.gate).toBeNull();
    expect(presenter.model.priorityOptions.map((option) => option.label)).toEqual([
      "Baja",
      "Media",
      "Alta",
    ]);
    expect(presenter.model.domainOptions[0]).toEqual({ value: "", label: "Sin dominio" });
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

  it("creates a trimmed concrete task, reloads the store, selects it, and resets", async () => {
    const { presenter, store, gateway } = build();
    const created = Task.from(taskDto({ id: "new-task" }));
    vi.spyOn(gateway, "createTask").mockResolvedValue(created);
    const listCallsBefore = gateway.callsTo("listTasks").length;

    presenter.setTitle(`  ${CONCRETE_TITLE}  `);
    presenter.setPriority(3);
    presenter.setDomain("work");
    await presenter.create();

    expect(gateway.createTask).toHaveBeenCalledWith({
      title: CONCRETE_TITLE,
      description: undefined,
      priority: 3,
      domain: "work",
    });
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

    presenter.setTitle(CONCRETE_TITLE);
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

    presenter.setTitle(CONCRETE_TITLE);
    await presenter.create();

    expect(presenter.model.title).toBe(CONCRETE_TITLE);
    expect(presenter.model.errorMessage).toBe("No se pudo agregar la tarea. Probá de nuevo.");
    expect(presenter.model.isCreating).toBe(false);
  });

  describe("clarification gate", () => {
    it("opens the gate for a vague title instead of creating", async () => {
      const { presenter, gateway } = build();
      const createSpy = vi.spyOn(gateway, "createTask");

      presenter.setTitle("gym");
      await presenter.create();

      expect(createSpy).not.toHaveBeenCalled();
      expect(presenter.model.gate).not.toBeNull();
      expect(presenter.model.gate?.reasons.length).toBeGreaterThan(0);
    });

    it("does not open the gate for a concrete title", async () => {
      const { presenter, gateway } = build();
      vi.spyOn(gateway, "createTask").mockResolvedValue(Task.from(taskDto()));

      presenter.setTitle(CONCRETE_TITLE);
      await presenter.create();

      expect(presenter.model.gate).toBeNull();
      expect(gateway.createTask).toHaveBeenCalled();
    });

    it("saves a clarified task folding outcome and next step into the description", async () => {
      const { presenter, gateway } = build();
      vi.spyOn(gateway, "createTask").mockResolvedValue(Task.from(taskDto()));

      presenter.setTitle("organizar");
      await presenter.create();
      presenter.setOutcome("inbox en cero");
      presenter.setNextStep("archivar lo viejo");
      await presenter.confirmClarified();

      expect(gateway.createTask).toHaveBeenCalledWith({
        title: "organizar",
        description: "Resultado esperado: inbox en cero\nSiguiente paso: archivar lo viejo",
        priority: 2,
        domain: undefined,
      });
      expect(presenter.model.gate).toBeNull();
    });

    it("create anyway submits without a clarified description", async () => {
      const { presenter, gateway } = build();
      vi.spyOn(gateway, "createTask").mockResolvedValue(Task.from(taskDto()));

      presenter.setTitle("gym");
      await presenter.create();
      await presenter.createAnyway();

      expect(gateway.createTask).toHaveBeenCalledWith({
        title: "gym",
        description: undefined,
        priority: 2,
        domain: undefined,
      });
    });

    it("keep editing closes the gate without creating", async () => {
      const { presenter, gateway } = build();
      const createSpy = vi.spyOn(gateway, "createTask");

      presenter.setTitle("gym");
      await presenter.create();
      presenter.dismissGate();

      expect(presenter.model.gate).toBeNull();
      expect(createSpy).not.toHaveBeenCalled();
      expect(presenter.model.title).toBe("gym");
    });

    it("using an example adopts it as the title and closes the gate", async () => {
      const { presenter } = build();

      presenter.setTitle("gym");
      await presenter.create();
      const example = presenter.model.gate!.examples[0];
      presenter.useExample(example);

      expect(presenter.model.title).toBe(example);
      expect(presenter.model.gate).toBeNull();
    });
  });
});
