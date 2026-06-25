import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { Task } from "@/core/domain/tasks/Task";
import { Project } from "@/core/domain/projects/Project";
import { ArchiveProject } from "../ArchiveProject";
import { AssignTaskToProject } from "../AssignTaskToProject";
import { CreateProject } from "../CreateProject";
import { GetProject } from "../GetProject";
import { ListProjects } from "../ListProjects";
import { ProjectsModule } from "../ProjectsModule";
import { UpdateProject } from "../UpdateProject";
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
});
