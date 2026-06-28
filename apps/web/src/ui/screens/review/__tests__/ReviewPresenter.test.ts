import type { Task as TaskDto, TaskReview } from "@vdp/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { HealthModule } from "@/core/app/health/HealthModule";
import { FakeHealthGateway } from "@/core/app/health/__tests__/fakes/FakeHealthGateway";
import { ProjectsModule } from "@/core/app/projects/ProjectsModule";
import { FakeProjectsGateway } from "@/core/app/projects/__tests__/fakes/FakeProjectsGateway";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { WalletModule } from "@/core/app/wallet/WalletModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { FakeWalletGateway } from "@/core/app/wallet/__tests__/fakes/FakeWalletGateway";
import { ProjectHoursReport } from "@/core/domain/projects/TimeEntry";
import { TasksEvents } from "@/ui/events/TasksEvents";
import { ReviewPresenter } from "../ReviewPresenter";

function pendingTask(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id: "p1",
    title: "Resolver alta",
    description: null,
    priority: 3,
    status: "pending",
    scheduledDate: "2026-06-14",
    domain: null,
    carryOverCount: 2,
    completedAt: null,
    createdAt: "2026-06-14T08:00:00.000Z",
    updatedAt: "2026-06-14T08:00:00.000Z",
    ...overrides,
  };
}

function review(overrides: Partial<TaskReview> = {}): TaskReview {
  return {
    date: "2026-06-14",
    total: 1,
    completed: 0,
    pending: 1,
    carriedOver: 0,
    discarded: 0,
    completionRate: 0,
    pendingTasks: [pendingTask()],
    allTasks: [pendingTask()],
    ...overrides,
  };
}

function build() {
  const tasks = new FakeTasksGateway();
  const wallet = new FakeWalletGateway();
  const health = new FakeHealthGateway();
  const projects = new FakeProjectsGateway();
  const getReview = vi.spyOn(tasks, "getReview").mockResolvedValue(review());
  const completeTask = vi.spyOn(tasks, "completeTask");
  vi.spyOn(projects, "getHoursReport").mockResolvedValue(ProjectHoursReport.from({
    fromDate: "2026-06-13",
    toDate: "2026-06-13",
    totalMinutes: 150,
    incomeTotals: [],
    rows: [
      {
        clientId: "c1",
        clientName: "Acme",
        projectId: "p1",
        projectOutcome: "Client portal",
        weekStart: "2026-06-08",
        minutes: 120,
        expectedIncome: null,
      },
      {
        clientId: null,
        clientName: null,
        projectId: "p2",
        projectOutcome: "Planning",
        weekStart: "2026-06-08",
        minutes: 30,
        expectedIncome: null,
      },
    ],
  }));
  const core = new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  })
    .use(new TasksModule(tasks))
    .use(new WalletModule(wallet))
    .use(new HealthModule(health))
    .use(new ProjectsModule(projects));
  const events = new TasksEvents();
  const presenter = new ReviewPresenter(vi.fn(), core, events);
  presenter.init(undefined);
  return { presenter, tasks, wallet, health, projects, getReview, completeTask, events };
}

async function flush() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

describe("ReviewPresenter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 13, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("aggregates today's review into the view model", async () => {
    const { presenter, projects, getReview } = build();

    presenter.start();
    await flush();

    expect(getReview).toHaveBeenCalledTimes(1);
    expect(presenter.model.taskQueue).toHaveLength(1);
    expect(presenter.model.taskQueue[0].title).toBe("Resolver alta");
    // carryOverCount > 0 picks the "se arrastra" detail copy
    expect(presenter.model.taskQueue[0].detail).toContain("se arrastra");
    expect(presenter.model.projectHours.totalLabel).toBe("2h 30m");
    expect(presenter.model.projectHours.rows.map((row) => row.durationLabel)).toEqual(["2h", "30m"]);
    expect(projects.getHoursReport).toHaveBeenCalledWith({
      fromDate: "2026-06-13",
      toDate: "2026-06-13",
    });
    expect(presenter.model.dateLabel).toBeTruthy();
    presenter.stop();
  });

  it("completes a task through the Core and reloads + signals the change", async () => {
    const { presenter, completeTask, getReview, events } = build();
    const emit = vi.spyOn(events, "emitTasksChanged");
    presenter.start();
    await flush();
    const reviewsBefore = getReview.mock.calls.length;

    await presenter.completeTask("p1");
    await flush();

    expect(completeTask).toHaveBeenCalledWith("p1");
    expect(getReview.mock.calls.length).toBeGreaterThan(reviewsBefore); // reloaded
    expect(emit).toHaveBeenCalled();
    expect(presenter.isTaskBusy("p1")).toBe(false);
    presenter.stop();
  });

  it("acknowledging a wallet signal does not crash and keeps the model consistent", async () => {
    const { presenter } = build();
    presenter.start();
    await flush();

    presenter.acknowledgeSignal("manual-signal");

    expect(presenter.model.editSheet.open).toBe(false);
    presenter.stop();
  });

  it("saves the mood check-in and folds it into ritual progress", async () => {
    const { presenter, health } = build();
    presenter.start();
    await flush();

    await presenter.saveMoodCheckIn(2, 4);
    await flush();

    expect(health.callsTo("saveMoodCheckIn")[0].args).toEqual([{ mood: 2, energy: 4 }]);
    expect(presenter.model.mood.selectedMood).toBe(2);
    expect(presenter.model.mood.selectedEnergy).toBe(4);
    expect(presenter.model.mood.weeklyInsight.toLowerCase()).toContain("ánimo");
    presenter.stop();
  });

  it("shows a useful error when the mood check-in cannot be saved", async () => {
    const { presenter, health } = build();
    vi.spyOn(health, "saveMoodCheckIn").mockRejectedValue(new Error("not migrated"));
    presenter.start();
    await flush();

    await presenter.saveMoodCheckIn(2, 4);

    expect(presenter.model.mood.error).toContain("backend");
    expect(presenter.model.mood.isSaving).toBe(false);
    expect(presenter.model.mood.selectedMood).toBeNull();
    presenter.stop();
  });
});
