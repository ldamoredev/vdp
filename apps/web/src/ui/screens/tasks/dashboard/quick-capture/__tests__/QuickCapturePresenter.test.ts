import type { Task as TaskDto } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { ProjectsModule } from "@/core/app/projects/ProjectsModule";
import { FakeProjectsGateway } from "@/core/app/projects/__tests__/fakes/FakeProjectsGateway";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { Project } from "@/core/domain/projects/Project";
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
  const projectsGateway = new FakeProjectsGateway();
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } })
    .use(new TasksModule(gateway))
    .use(new ProjectsModule(projectsGateway));
  const store = new TasksDashboardStore(core, new TasksEvents(), "2026-06-13");
  const presenter = new QuickCapturePresenter(vi.fn(), store, core);
  presenter.init(undefined);
  return { presenter, store, gateway, projectsGateway };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

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
  it("prefills the title from an initial value (inbox triage deep-link)", () => {
    const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } })
      .use(new TasksModule(new FakeTasksGateway()))
      .use(new ProjectsModule(new FakeProjectsGateway()));
    const store = new TasksDashboardStore(core, new TasksEvents(), "2026-06-13");
    const presenter = new QuickCapturePresenter(vi.fn(), store, core, "Pagar la luz");
    presenter.init(undefined);

    expect(presenter.model.title).toBe("Pagar la luz");
  });

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
    expect(presenter.model.projectOptions[0]).toEqual({ value: "", label: "Sin proyecto" });
  });

  it("projects form changes into the view model", () => {
    const { presenter } = build();

    presenter.setTitle(" Revisar propuesta ");
    presenter.setPriority(3);
    presenter.setDomain("work");
    presenter.setProject("p1");

    expect(presenter.model.title).toBe(" Revisar propuesta ");
    expect(presenter.model.priority).toBe(3);
    expect(presenter.model.domain).toBe("work");
    expect(presenter.model.projectId).toBe("p1");
    expect(presenter.model.canCreate).toBe(true);
    expect(presenter.model.priorityOptions.find((option) => option.value === 3)?.selected).toBe(true);
  });

  it("loads active projects and sends the selected project when creating", async () => {
    const { presenter, gateway, projectsGateway } = build();
    projectsGateway.projects = [
      Project.from({
        id: "p-active",
        kind: "work",
        outcome: "Client portal",
        nextAction: "Wire selector",
        focus: "Tasks",
        clientId: "c1",
        client: "Acme",
        hourlyRate: null,
        rateCurrency: "ARS",
        status: "active",
        archivedAt: null,
        createdAt: "2026-06-13T08:00:00.000Z",
        updatedAt: "2026-06-13T09:00:00.000Z",
      }),
      Project.from({
        id: "p-archived",
        kind: "work",
        outcome: "Old thing",
        nextAction: "None",
        focus: "Archive",
        clientId: null,
        client: null,
        hourlyRate: null,
        rateCurrency: "ARS",
        status: "archived",
        archivedAt: "2026-06-13T10:00:00.000Z",
        createdAt: "2026-06-12T08:00:00.000Z",
        updatedAt: "2026-06-12T09:00:00.000Z",
      }),
    ];
    vi.spyOn(gateway, "createTask").mockResolvedValue(Task.from(taskDto()));

    presenter.start();
    await flush();
    presenter.setTitle(CONCRETE_TITLE);
    presenter.setProject("p-active");
    await presenter.create();

    expect(projectsGateway.callsTo("listProjects")).toHaveLength(1);
    expect(presenter.model.projectOptions).toEqual([
      { value: "", label: "Sin proyecto" },
      { value: "p-active", label: "Acme · Client portal" },
    ]);
    expect(gateway.createTask).toHaveBeenCalledWith({
      title: CONCRETE_TITLE,
      description: undefined,
      priority: 2,
      domain: undefined,
      projectId: "p-active",
    });
    expect(presenter.model.projectId).toBe("");
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
      projectId: undefined,
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
        projectId: undefined,
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
        projectId: undefined,
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
