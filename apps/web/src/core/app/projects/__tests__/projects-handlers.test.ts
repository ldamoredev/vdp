import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { Task } from "@/core/domain/tasks/Task";
import { Client } from "@/core/domain/projects/Client";
import { Project } from "@/core/domain/projects/Project";
import { ProjectHoursReport, TimeEntry } from "@/core/domain/projects/TimeEntry";
import { ArchiveClient } from "../ArchiveClient";
import { ArchiveProject } from "../ArchiveProject";
import { AssignTaskToProject } from "../AssignTaskToProject";
import { CreateClient } from "../CreateClient";
import { CreateProject } from "../CreateProject";
import { DeleteTimeEntry } from "../DeleteTimeEntry";
import { GetHoursReport } from "../GetHoursReport";
import { GetProject } from "../GetProject";
import { ListClients } from "../ListClients";
import { ListProjects } from "../ListProjects";
import { ListTimeEntries } from "../ListTimeEntries";
import { LogTimeEntry } from "../LogTimeEntry";
import { ProjectsModule } from "../ProjectsModule";
import { UpdateClient } from "../UpdateClient";
import { UpdateProject } from "../UpdateProject";
import { UpdateTimeEntry } from "../UpdateTimeEntry";
import { FakeProjectsGateway } from "./fakes/FakeProjectsGateway";

function coreWith(gateway: FakeProjectsGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new ProjectsModule(gateway));
}

describe("projects handlers (dispatched through the bus)", () => {
  it("routes list/get through the gateway and returns domain models", async () => {
    const gateway = new FakeProjectsGateway();
    const core = coreWith(gateway);

    const projects = await core.execute(new ListProjects());
    const project = await core.execute(new GetProject("p1"));

    expect(gateway.callsTo("listProjects")).toHaveLength(1);
    expect(gateway.callsTo("getProject")[0].args).toEqual(["p1"]);
    expect(projects[0]).toBeInstanceOf(Project);
    expect(project).toBeInstanceOf(Project);
  });

  it("routes create/update/archive commands", async () => {
    const gateway = new FakeProjectsGateway();
    const core = coreWith(gateway);

    await core.execute(new CreateProject({
      kind: "work",
      outcome: "Outcome",
      nextAction: "Next",
      focus: "Focus",
      client: "Acme",
    }));
    await core.execute(new UpdateProject("p1", { focus: "New focus" }));
    const archived = await core.execute(new ArchiveProject("p1"));

    expect(gateway.callsTo("createProject")[0].args[0]).toMatchObject({ outcome: "Outcome" });
    expect(gateway.callsTo("updateProject")[0].args).toEqual(["p1", { focus: "New focus" }]);
    expect(gateway.callsTo("archiveProject")[0].args).toEqual(["p1"]);
    expect(archived.status).toBe("archived");
  });

  it("routes task assignment through the projects gateway", async () => {
    const gateway = new FakeProjectsGateway();

    const task = await coreWith(gateway).execute(
      new AssignTaskToProject("p1", { taskId: "t1", boardStatus: "doing" }),
    );

    expect(gateway.callsTo("assignTaskToProject")[0].args).toEqual([
      "p1",
      { taskId: "t1", boardStatus: "doing" },
    ]);
    expect(task).toBeInstanceOf(Task);
    expect(task.projectId).toBe("p1");
  });

  it("routes client list/create/update/archive through the gateway", async () => {
    const gateway = new FakeProjectsGateway();
    const core = coreWith(gateway);

    const clients = await core.execute(new ListClients());
    await core.execute(new CreateClient({ name: "Globex" }));
    await core.execute(new UpdateClient("c1", { name: "Renamed" }));
    const archived = await core.execute(new ArchiveClient("c1"));

    expect(clients[0]).toBeInstanceOf(Client);
    expect(gateway.callsTo("createClient")[0].args[0]).toEqual({ name: "Globex" });
    expect(gateway.callsTo("updateClient")[0].args).toEqual(["c1", { name: "Renamed" }]);
    expect(gateway.callsTo("archiveClient")[0].args).toEqual(["c1"]);
    expect(archived.status).toBe("archived");
  });

  it("routes time entry log/list/update/delete through the gateway", async () => {
    const gateway = new FakeProjectsGateway();
    const core = coreWith(gateway);

    const entries = await core.execute(new ListTimeEntries({ projectId: "p1" }));
    await core.execute(new LogTimeEntry({ projectId: "p1", date: "2026-06-13", minutes: 90 }));
    await core.execute(new UpdateTimeEntry("te1", { minutes: 120 }));
    const deleted = await core.execute(new DeleteTimeEntry("te1"));

    expect(entries[0]).toBeInstanceOf(TimeEntry);
    expect(gateway.callsTo("listTimeEntries")[0].args).toEqual([{ projectId: "p1" }]);
    expect(gateway.callsTo("logTimeEntry")[0].args[0]).toMatchObject({ projectId: "p1", minutes: 90 });
    expect(gateway.callsTo("updateTimeEntry")[0].args).toEqual(["te1", { minutes: 120 }]);
    expect(deleted).toBe(true);
  });

  it("routes the hours report query through the gateway", async () => {
    const gateway = new FakeProjectsGateway();

    const report = await coreWith(gateway).execute(
      new GetHoursReport({ fromDate: "2026-06-01", toDate: "2026-06-30" }),
    );

    expect(report).toBeInstanceOf(ProjectHoursReport);
    expect(gateway.callsTo("getHoursReport")[0].args[0]).toEqual({
      fromDate: "2026-06-01",
      toDate: "2026-06-30",
    });
  });
});
