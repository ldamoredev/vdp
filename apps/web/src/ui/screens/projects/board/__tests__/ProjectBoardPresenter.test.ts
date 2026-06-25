import type { Task as TaskDto } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { ProjectsModule } from "@/core/app/projects/ProjectsModule";
import { FakeProjectsGateway } from "@/core/app/projects/__tests__/fakes/FakeProjectsGateway";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { Task } from "@/core/domain/tasks/Task";
import { ProjectBoardPresenter } from "../ProjectBoardPresenter";

function taskDto(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: "t1",
    title: "Tarea",
    description: null,
    priority: 1,
    status: "pending",
    scheduledDate: "2026-06-13",
    domain: null,
    projectId: "p1",
    boardStatus: "backlog",
    carryOverCount: 0,
    completedAt: null,
    createdAt: "2026-06-13T08:00:00.000Z",
    updatedAt: "2026-06-13T08:00:00.000Z",
    ...overrides,
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function build(tasks: TaskDto[]) {
  const projectsGateway = new FakeProjectsGateway();
  const tasksGateway = new FakeTasksGateway();
  vi.spyOn(tasksGateway, "listTasks").mockResolvedValue({ tasks: tasks.map(Task.from), total: tasks.length });
  const core = new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  })
    .use(new ProjectsModule(projectsGateway))
    .use(new TasksModule(tasksGateway));
  const presenter = new ProjectBoardPresenter(vi.fn(), core, "p1");
  presenter.init(undefined);
  presenter.start();
  await flush();
  return { presenter, projectsGateway, tasksGateway };
}

describe("ProjectBoardPresenter", () => {
  it("loads tasks through the task read path and groups by board status", async () => {
    const { presenter, tasksGateway } = await build([
      taskDto({ id: "backlog", boardStatus: "backlog" }),
      taskDto({ id: "next", boardStatus: "next" }),
      taskDto({ id: "doing", boardStatus: "doing" }),
      taskDto({ id: "done", boardStatus: "done", status: "done" }),
    ]);

    expect((tasksGateway.listTasks as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({
      projectId: "p1",
      limit: "200",
    });
    expect(Object.fromEntries(presenter.model.columns.map((column) => [column.id, column.count]))).toEqual({
      backlog: 1,
      next: 1,
      doing: 1,
      done: 1,
    });
  });

  it("moves a task through the projects assignment use case", async () => {
    const { presenter, projectsGateway } = await build([taskDto({ id: "t1" })]);

    await presenter.moveTask("t1", "doing");

    expect(projectsGateway.callsTo("assignTaskToProject")[0].args).toEqual([
      "p1",
      { taskId: "t1", boardStatus: "doing" },
    ]);
  });
});
