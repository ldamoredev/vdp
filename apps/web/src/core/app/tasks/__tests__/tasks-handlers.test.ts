import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { Task } from "@/core/domain/tasks/Task";
import { AddTaskNote } from "../AddTaskNote";
import { CarryOverAll } from "../CarryOverAll";
import { CarryOverTask } from "../CarryOverTask";
import { CompleteTask } from "../CompleteTask";
import { CreateTask } from "../CreateTask";
import { DeleteTask } from "../DeleteTask";
import { DiscardTask } from "../DiscardTask";
import { GetCarryOverRate } from "../GetCarryOverRate";
import { GetDailyReviewState } from "../GetDailyReviewState";
import { GetRecentInsights } from "../GetRecentInsights";
import { SaveDailyReviewState } from "../SaveDailyReviewState";
import { GetTask } from "../GetTask";
import { GetTaskReview } from "../GetTaskReview";
import { GetTaskTrend } from "../GetTaskTrend";
import { GetTasksByDomain } from "../GetTasksByDomain";
import { GetTodayStats } from "../GetTodayStats";
import { ListTaskNotes } from "../ListTaskNotes";
import { ListTasks } from "../ListTasks";
import { StartTask } from "../StartTask";
import { TasksModule } from "../TasksModule";
import { UpdateTask } from "../UpdateTask";
import { FakeTasksGateway } from "./fakes/FakeTasksGateway";

function coreWith(gateway: FakeTasksGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new TasksModule(gateway));
}

describe("tasks handlers (dispatched through the bus)", () => {
  describe("CRUD", () => {
    it("ListTasks forwards params and maps to domain models", async () => {
      const gateway = new FakeTasksGateway();
      const result = await coreWith(gateway).execute(new ListTasks({ scheduledDate: "2026-06-13" }));
      expect(gateway.callsTo("listTasks")[0].args).toEqual([{ scheduledDate: "2026-06-13" }]);
      expect(result.tasks[0]).toBeInstanceOf(Task);
      expect(result.total).toBe(1);
    });

    it("GetTask returns task + notes", async () => {
      const gateway = new FakeTasksGateway();
      const result = await coreWith(gateway).execute(new GetTask("t1"));
      expect(gateway.callsTo("getTask")[0].args).toEqual(["t1"]);
      expect(result.task).toBeInstanceOf(Task);
      expect(result.notes).toHaveLength(1);
    });

    it("CreateTask and UpdateTask forward inputs and return a model", async () => {
      const gateway = new FakeTasksGateway();
      const core = coreWith(gateway);
      const created = await core.execute(new CreateTask({ title: "Nueva" }));
      await core.execute(new UpdateTask("t1", { priority: 3 }));
      expect(gateway.callsTo("createTask")[0].args).toEqual([{ title: "Nueva" }]);
      expect(gateway.callsTo("updateTask")[0].args).toEqual(["t1", { priority: 3 }]);
      expect(created).toBeInstanceOf(Task);
    });

    it("DeleteTask forwards the id", async () => {
      const gateway = new FakeTasksGateway();
      await coreWith(gateway).execute(new DeleteTask("t9"));
      expect(gateway.callsTo("deleteTask")[0].args).toEqual(["t9"]);
    });
  });

  describe("transitions", () => {
    it("CompleteTask returns the completed model", async () => {
      const gateway = new FakeTasksGateway();
      const task = await coreWith(gateway).execute(new CompleteTask("t1"));
      expect(gateway.callsTo("completeTask")[0].args).toEqual(["t1"]);
      expect(task.isDone).toBe(true);
    });

    it("StartTask forwards id and returns the in-progress model", async () => {
      const gateway = new FakeTasksGateway();
      const task = await coreWith(gateway).execute(new StartTask("t1"));
      expect(gateway.callsTo("startTask")[0].args).toEqual(["t1"]);
      expect(task.isInProgress).toBe(true);
    });

    it("CarryOverTask forwards id and optional toDate; DiscardTask forwards id", async () => {
      const gateway = new FakeTasksGateway();
      const core = coreWith(gateway);
      await core.execute(new CarryOverTask("t1", "2026-06-14"));
      await core.execute(new DiscardTask("t2"));
      expect(gateway.callsTo("carryOverTask")[0].args).toEqual(["t1", "2026-06-14"]);
      expect(gateway.callsTo("discardTask")[0].args).toEqual(["t2"]);
    });

    it("CarryOverAll forwards fromDate/toDate", async () => {
      const gateway = new FakeTasksGateway();
      await coreWith(gateway).execute(new CarryOverAll("2026-06-12", "2026-06-13"));
      expect(gateway.callsTo("carryOverAll")[0].args).toEqual(["2026-06-12", "2026-06-13"]);
    });
  });

  describe("review, notes & stats", () => {
    it("routes review, insights, notes and stats queries to the gateway", async () => {
      const gateway = new FakeTasksGateway();
      const core = coreWith(gateway);
      await core.execute(new GetTaskReview("2026-06-13"));
      await core.execute(new GetRecentInsights(3));
      await core.execute(new ListTaskNotes("t1"));
      await core.execute(new AddTaskNote("t1", "hola", "blocker"));
      await core.execute(new GetTodayStats());
      await core.execute(new GetTaskTrend(7));
      await core.execute(new GetTasksByDomain({ days: "30" }));
      await core.execute(new GetCarryOverRate(7));

      expect(gateway.callsTo("getReview")[0].args).toEqual(["2026-06-13"]);
      expect(gateway.callsTo("getRecentInsights")[0].args).toEqual([3]);
      expect(gateway.callsTo("listNotes")[0].args).toEqual(["t1"]);
      expect(gateway.callsTo("addNote")[0].args).toEqual(["t1", "hola", "blocker"]);
      expect(gateway.callsTo("getTodayStats")).toHaveLength(1);
      expect(gateway.callsTo("getTrend")[0].args).toEqual([7]);
      expect(gateway.callsTo("getByDomain")[0].args).toEqual([{ days: "30" }]);
      expect(gateway.callsTo("getCarryOverRate")[0].args).toEqual([7]);
    });

    it("routes the daily-review-state get/save through the gateway", async () => {
      const gateway = new FakeTasksGateway();
      const core = coreWith(gateway);
      const state = {
        date: "2026-06-13",
        acknowledgedSignalIds: ["sig-1"],
        watchedCategoryIds: ["cat-1"],
        note: "cerrar mañana temprano",
        openedAt: "2026-06-13T08:00:00.000Z",
        completedAt: null,
        focusTaskId: "task-focus",
        plannedAt: "2026-06-13T09:00:00.000Z",
      };

      const saved = await core.execute(new SaveDailyReviewState(state));
      expect(gateway.callsTo("saveReviewState")[0].args).toEqual([state]);
      expect(saved).toEqual(state);

      const loaded = await core.execute(new GetDailyReviewState("2026-06-13"));
      expect(gateway.callsTo("getReviewState")[0].args).toEqual(["2026-06-13"]);
      expect(loaded).toEqual(state);
    });

    it("returns null when no review state has been persisted for the day", async () => {
      const gateway = new FakeTasksGateway();
      const result = await coreWith(gateway).execute(new GetDailyReviewState("2026-06-13"));
      expect(result).toBeNull();
    });
  });

  describe("board data contract", () => {
    it("ListTasks filters by domain and status for a module board", async () => {
      const gateway = new FakeTasksGateway();
      await coreWith(gateway).execute(new ListTasks({ domain: "wallet", status: "pending" }));
      expect(gateway.callsTo("listTasks")[0].args).toEqual([{ domain: "wallet", status: "pending" }]);
    });

    it("CreateTask tags the new task with its module domain", async () => {
      const gateway = new FakeTasksGateway();
      await coreWith(gateway).execute(
        new CreateTask({ title: "Revisar gastos", priority: 2, domain: "wallet" }),
      );
      expect(gateway.callsTo("createTask")[0].args).toEqual([
        { title: "Revisar gastos", priority: 2, domain: "wallet" },
      ]);
    });
  });
});
