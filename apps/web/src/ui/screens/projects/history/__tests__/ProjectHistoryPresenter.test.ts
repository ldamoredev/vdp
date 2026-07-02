import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { ProjectsModule } from "@/core/app/projects/ProjectsModule";
import { FakeProjectsGateway } from "@/core/app/projects/__tests__/fakes/FakeProjectsGateway";
import { Project } from "@/core/domain/projects/Project";
import { TimeEntry } from "@/core/domain/projects/TimeEntry";
import { ProjectHistoryPresenter } from "../ProjectHistoryPresenter";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function coreWith(gateway: FakeProjectsGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new ProjectsModule(gateway));
}

function project(id: string, status: "active" | "archived", overrides: Record<string, unknown> = {}): Project {
  return Project.from({
    id,
    kind: "work",
    outcome: `Outcome ${id}`,
    nextAction: "Next",
    focus: "Now",
    clientId: "c1",
    client: null,
    hourlyRate: null,
    rateCurrency: "ARS",
    status,
    archivedAt: status === "archived" ? "2026-06-20T09:00:00.000Z" : null,
    createdAt: "2026-06-10T08:00:00.000Z",
    updatedAt: "2026-06-10T08:00:00.000Z",
    ...overrides,
  });
}

function entry(id: string, projectId: string, minutes: number): TimeEntry {
  return TimeEntry.from({
    id,
    projectId,
    taskId: null,
    date: "2026-06-18",
    minutes,
    note: null,
    createdAt: "2026-06-18T08:00:00.000Z",
    updatedAt: "2026-06-18T08:00:00.000Z",
  });
}

describe("ProjectHistoryPresenter", () => {
  it("lists only archived projects with client label and total logged hours", async () => {
    const gateway = new FakeProjectsGateway();
    gateway.projects = [project("arch", "archived"), project("live", "active")];
    gateway.timeEntries = [entry("e1", "arch", 60), entry("e2", "arch", 30), entry("e3", "live", 45)];
    const presenter = new ProjectHistoryPresenter(vi.fn(), coreWith(gateway));

    presenter.init(undefined);
    presenter.start();
    await flush();

    expect(presenter.model.projects).toHaveLength(1);
    expect(presenter.model.projects[0]).toMatchObject({
      id: "arch",
      clientLabel: "Acme",
      totalHoursLabel: "1h 30m",
    });
    expect(presenter.model.projects[0].archivedAtLabel).not.toBe("");
  });

  it("unarchives a project and drops it from the history list", async () => {
    const gateway = new FakeProjectsGateway();
    gateway.projects = [project("arch", "archived")];
    gateway.timeEntries = [];
    const presenter = new ProjectHistoryPresenter(vi.fn(), coreWith(gateway));
    presenter.init(undefined);
    presenter.start();
    await flush();

    expect(presenter.model.projects).toHaveLength(1);
    await presenter.unarchiveProject("arch");

    expect(gateway.callsTo("unarchiveProject")[0].args).toEqual(["arch"]);
    expect(presenter.model.projects).toHaveLength(0);
  });
});
