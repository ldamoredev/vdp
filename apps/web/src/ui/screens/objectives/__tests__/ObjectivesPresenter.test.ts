import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { ObjectivesModule } from "@/core/app/objectives/ObjectivesModule";
import { FakeObjectivesGateway } from "@/core/app/objectives/__tests__/fakes/FakeObjectivesGateway";
import { ProjectsModule } from "@/core/app/projects/ProjectsModule";
import { FakeProjectsGateway } from "@/core/app/projects/__tests__/fakes/FakeProjectsGateway";
import { Objective } from "@/core/domain/objectives/Objective";
import { ObjectivesPresenter } from "../ObjectivesPresenter";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function coreWith(objectives: FakeObjectivesGateway, projects = new FakeProjectsGateway()): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  })
    .use(new ObjectivesModule(objectives))
    .use(new ProjectsModule(projects));
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
