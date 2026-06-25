import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { ProjectsModule } from "@/core/app/projects/ProjectsModule";
import { FakeProjectsGateway } from "@/core/app/projects/__tests__/fakes/FakeProjectsGateway";
import { Project } from "@/core/domain/projects/Project";
import { ProjectsListPresenter } from "../ProjectsListPresenter";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function coreWith(gateway: FakeProjectsGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new ProjectsModule(gateway));
}

describe("ProjectsListPresenter", () => {
  it("loads projects and selects the first active project", async () => {
    const gateway = new FakeProjectsGateway();
    gateway.projects = [
      Project.from({
        id: "archived",
        kind: "personal",
        outcome: "Archived",
        nextAction: "None",
        focus: "Old",
        client: null,
        status: "archived",
        archivedAt: "2026-06-10T08:00:00.000Z",
        createdAt: "2026-06-10T08:00:00.000Z",
        updatedAt: "2026-06-10T08:00:00.000Z",
      }),
      Project.from({
        id: "active",
        kind: "work",
        outcome: "Active",
        nextAction: "Next",
        focus: "Now",
        client: "Acme",
        status: "active",
        archivedAt: null,
        createdAt: "2026-06-13T08:00:00.000Z",
        updatedAt: "2026-06-13T08:00:00.000Z",
      }),
    ];
    const presenter = new ProjectsListPresenter(vi.fn(), coreWith(gateway));

    presenter.init(undefined);
    presenter.start();
    await flush();

    expect(presenter.model.selectedProjectId).toBe("active");
    expect(presenter.model.projects[0]).toMatchObject({
      id: "active",
      kindLabel: "Trabajo",
      clientLabel: "Acme",
      isSelected: true,
    });
  });

  it("creates a project and selects it", async () => {
    const gateway = new FakeProjectsGateway();
    const presenter = new ProjectsListPresenter(vi.fn(), coreWith(gateway));
    presenter.init(undefined);
    presenter.start();
    await flush();

    presenter.openForm();
    presenter.setOutcome("Ship reports");
    presenter.setNextAction("Create report");
    presenter.setFocus("Client visibility");
    presenter.setClient("Acme");
    await presenter.createProject();

    expect(gateway.callsTo("createProject")[0].args[0]).toMatchObject({
      kind: "work",
      outcome: "Ship reports",
      nextAction: "Create report",
      focus: "Client visibility",
      client: "Acme",
    });
    expect(presenter.model.selectedProjectId).toBe("created");
    expect(presenter.model.form.isOpen).toBe(false);
  });
});
