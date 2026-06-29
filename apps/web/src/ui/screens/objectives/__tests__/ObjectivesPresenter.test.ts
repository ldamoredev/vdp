import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { ObjectivesModule } from "@/core/app/objectives/ObjectivesModule";
import { FakeObjectivesGateway } from "@/core/app/objectives/__tests__/fakes/FakeObjectivesGateway";
import { ProjectsModule } from "@/core/app/projects/ProjectsModule";
import { FakeProjectsGateway } from "@/core/app/projects/__tests__/fakes/FakeProjectsGateway";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { WalletModule } from "@/core/app/wallet/WalletModule";
import { FakeWalletGateway } from "@/core/app/wallet/__tests__/fakes/FakeWalletGateway";
import { Objective } from "@/core/domain/objectives/Objective";
import { ObjectivesPresenter } from "../ObjectivesPresenter";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function coreWith(
  objectives: FakeObjectivesGateway,
  projects = new FakeProjectsGateway(),
  tasks = new FakeTasksGateway(),
  wallet = new FakeWalletGateway(),
): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  })
    .use(new ObjectivesModule(objectives))
    .use(new ProjectsModule(projects))
    .use(new TasksModule(tasks))
    .use(new WalletModule(wallet));
}

function objective(overrides: Partial<Parameters<typeof Objective.from>[0]> = {}): Objective {
  return Objective.from({
    id: "o1",
    title: "Manual score",
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    metricSource: "manual",
    target: 10,
    unit: "puntos",
    manualValue: 4,
    currency: null,
    status: "active",
    archivedAt: null,
    achievedAt: null,
    createdAt: "2026-06-28T10:00:00.000Z",
    updatedAt: "2026-06-28T10:00:00.000Z",
    ...overrides,
  });
}

describe("ObjectivesPresenter", () => {
  it("loads objectives and computes manual progress", async () => {
    const objectives = new FakeObjectivesGateway();
    objectives.objectives = [objective()];
    const presenter = new ObjectivesPresenter(vi.fn(), coreWith(objectives));

    presenter.init(undefined);
    presenter.start();
    await flush();

    expect(presenter.model.objectives[0]).toMatchObject({
      id: "o1",
      title: "Manual score",
      sourceLabel: "Manual",
      currentValueLabel: "4 puntos",
      targetValueLabel: "10 puntos",
      progressPercent: 40,
      progressLabel: "40%",
    });
  });

  it("computes projects hours progress through the metric catalog", async () => {
    const objectives = new FakeObjectivesGateway();
    const projects = new FakeProjectsGateway();
    objectives.objectives = [
      objective({
        id: "hours",
        title: "Tres horas facturables",
        metricSource: "projects_hours",
        target: 3,
        unit: "h",
        manualValue: null,
        periodStart: "2026-07-01",
        periodEnd: "2026-09-30",
      }),
    ];
    const presenter = new ObjectivesPresenter(vi.fn(), coreWith(objectives, projects));

    presenter.init(undefined);
    presenter.start();
    await flush();

    expect(projects.callsTo("getHoursReport")[0].args[0]).toEqual({
      fromDate: "2026-07-01",
      toDate: "2026-09-30",
    });
    expect(presenter.model.objectives[0]).toMatchObject({
      sourceLabel: "Horas de proyectos",
      currentValueLabel: "1,5 h",
      targetValueLabel: "3 h",
      progressPercent: 50,
      progressLabel: "50%",
    });
  });

  it("sends currency when creating a wallet savings objective", async () => {
    const objectives = new FakeObjectivesGateway();
    objectives.objectives = [];
    const presenter = new ObjectivesPresenter(vi.fn(), coreWith(objectives));

    presenter.init(undefined);
    presenter.openCreateForm();
    presenter.setTitle("Ahorrar USD");
    presenter.setMetricSource("wallet_savings");
    presenter.setCurrency("USD");
    presenter.setTarget("1500");

    expect(presenter.model.form.isCurrencyScoped).toBe(true);

    await presenter.saveForm();

    expect(objectives.callsTo("createObjective")[0].args[0]).toMatchObject({
      metricSource: "wallet_savings",
      currency: "USD",
      unit: "USD",
    });
  });

  it("flags wallet savings objectives so the card can explain the progress source", async () => {
    const objectives = new FakeObjectivesGateway();
    objectives.objectives = [
      objective({
        id: "savings",
        title: "Ahorrar para vacaciones",
        metricSource: "wallet_savings",
        target: 1000,
        unit: "ARS",
        manualValue: null,
        currency: "ARS",
      }),
    ];
    const presenter = new ObjectivesPresenter(vi.fn(), coreWith(objectives));

    presenter.init(undefined);
    presenter.start();
    await flush();

    expect(presenter.model.objectives[0]).toMatchObject({
      sourceLabel: "Ahorro (Wallet)",
      currentValueLabel: "250 ARS",
      targetValueLabel: "1.000 ARS",
      tracksSavings: true,
    });
  });

  it("marks active objectives achieved on load when progress reaches the target", async () => {
    const objectives = new FakeObjectivesGateway();
    objectives.objectives = [
      objective({
        id: "achieve-me",
        target: 10,
        manualValue: 12,
        status: "active",
      }),
    ];
    const presenter = new ObjectivesPresenter(vi.fn(), coreWith(objectives));

    presenter.init(undefined);
    presenter.start();
    await flush();
    await flush();

    expect(objectives.callsTo("markObjectiveAchieved")[0].args).toEqual(["achieve-me"]);
    expect(presenter.model.objectives[0]).toMatchObject({
      statusLabel: "Lograda",
      progressPercent: 100,
      progressLabel: "100%",
      isAchieved: true,
    });
  });

  it("does not mark already achieved objectives again", async () => {
    const objectives = new FakeObjectivesGateway();
    objectives.objectives = [
      objective({
        id: "already-achieved",
        target: 10,
        manualValue: 12,
        status: "achieved",
        achievedAt: "2026-06-28T12:00:00.000Z",
      }),
    ];
    const presenter = new ObjectivesPresenter(vi.fn(), coreWith(objectives));

    presenter.init(undefined);
    presenter.start();
    await flush();

    expect(objectives.callsTo("markObjectiveAchieved")).toHaveLength(0);
    expect(presenter.model.objectives[0].statusLabel).toBe("Lograda");
  });

  it("computes completed tasks progress through the metric catalog", async () => {
    const objectives = new FakeObjectivesGateway();
    const tasks = new FakeTasksGateway();
    tasks.domainStats = [
      { domain: "work", count: 2 },
      { domain: "health", count: 1 },
    ];
    objectives.objectives = [
      objective({
        id: "tasks",
        title: "Completar tareas",
        metricSource: "tasks_completed",
        target: 6,
        unit: "tareas",
        manualValue: null,
        periodStart: "2026-07-01",
        periodEnd: "2026-09-30",
      }),
    ];
    const presenter = new ObjectivesPresenter(vi.fn(), coreWith(objectives, new FakeProjectsGateway(), tasks));

    presenter.init(undefined);
    presenter.start();
    await flush();

    expect(tasks.callsTo("getByDomain")[0].args[0]).toEqual({
      from: "2026-07-01",
      to: "2026-09-30",
    });
    expect(presenter.model.objectives[0]).toMatchObject({
      sourceLabel: "Tareas completadas",
      currentValueLabel: "3 tareas",
      targetValueLabel: "6 tareas",
      progressPercent: 50,
    });
  });

  it("creates an objective from the form and reloads", async () => {
    const objectives = new FakeObjectivesGateway();
    const presenter = new ObjectivesPresenter(vi.fn(), coreWith(objectives));
    presenter.init(undefined);
    presenter.start();
    await flush();

    presenter.openCreateForm();
    presenter.setTitle("Leer 12 libros");
    presenter.setMetricSource("manual");
    presenter.setTarget("12");
    presenter.setUnit("libros");
    presenter.setManualValue("2");
    await presenter.saveForm();

    expect(objectives.callsTo("createObjective")[0].args[0]).toMatchObject({
      title: "Leer 12 libros",
      metricSource: "manual",
      target: 12,
      unit: "libros",
      manualValue: 2,
    });
    expect(presenter.model.form.isOpen).toBe(false);
  });
});
