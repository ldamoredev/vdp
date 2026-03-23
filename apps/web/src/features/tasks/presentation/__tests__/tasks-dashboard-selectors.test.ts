import { describe, it, expect } from "vitest";
import type { Task, TaskNote } from "@/lib/api/types";
import {
  sortExecutionQueue,
  getFilterTasks,
  getTaskTone,
  getPlanningToneClasses,
  formatTaskDate,
  noteTypeLabel,
  noteTypeTone,
  buildPlanningSignals,
  taskDomainOptions,
} from "../tasks-dashboard-selectors";

// ─── Test helpers ───────────────────────────────────────────

function aTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    title: "Test task",
    description: null,
    priority: 2,
    status: "pending",
    scheduledDate: "2026-03-23",
    domain: null,
    carryOverCount: 0,
    completedAt: null,
    createdAt: "2026-03-23T10:00:00Z",
    updatedAt: "2026-03-23T10:00:00Z",
    ...overrides,
  };
}

// ─── sortExecutionQueue ─────────────────────────────────────

describe("sortExecutionQueue", () => {
  it("places pending before done", () => {
    const done = aTask({ status: "done", title: "done" });
    const pending = aTask({ status: "pending", title: "pending" });

    const result = sortExecutionQueue([done, pending]);

    expect(result[0].title).toBe("pending");
    expect(result[1].title).toBe("done");
  });

  it("sorts by carry-over count descending within same status", () => {
    const low = aTask({ carryOverCount: 1, title: "low" });
    const high = aTask({ carryOverCount: 5, title: "high" });

    const result = sortExecutionQueue([low, high]);

    expect(result[0].title).toBe("high");
    expect(result[1].title).toBe("low");
  });

  it("sorts by priority descending when carry-over is equal", () => {
    const p1 = aTask({ priority: 1, title: "p1" });
    const p3 = aTask({ priority: 3, title: "p3" });

    const result = sortExecutionQueue([p1, p3]);

    expect(result[0].title).toBe("p3");
    expect(result[1].title).toBe("p1");
  });

  it("sorts by createdAt ascending as final tiebreaker", () => {
    const older = aTask({ createdAt: "2026-03-23T08:00:00Z", title: "older" });
    const newer = aTask({ createdAt: "2026-03-23T12:00:00Z", title: "newer" });

    const result = sortExecutionQueue([newer, older]);

    expect(result[0].title).toBe("older");
    expect(result[1].title).toBe("newer");
  });

  it("does not mutate the original array", () => {
    const tasks = [aTask({ priority: 1 }), aTask({ priority: 3 })];
    const original = [...tasks];

    sortExecutionQueue(tasks);

    expect(tasks[0].priority).toBe(original[0].priority);
  });
});

// ─── getFilterTasks ─────────────────────────────────────────

describe("getFilterTasks", () => {
  const pending = aTask({ status: "pending", priority: 1, carryOverCount: 0 });
  const done = aTask({ status: "done" });
  const focusHighPriority = aTask({ status: "pending", priority: 2 });
  const focusCarryOver = aTask({ status: "pending", priority: 1, carryOverCount: 1 });
  const tasks = [pending, done, focusHighPriority, focusCarryOver];

  it("returns only pending tasks for 'pending' filter", () => {
    const result = getFilterTasks(tasks, "pending");

    expect(result).toHaveLength(3);
    expect(result.every((t) => t.status === "pending")).toBe(true);
  });

  it("returns only done tasks for 'done' filter", () => {
    const result = getFilterTasks(tasks, "done");

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(done);
  });

  it("returns pending tasks with priority >= 2 or carry-over > 0 for 'focus'", () => {
    const result = getFilterTasks(tasks, "focus");

    expect(result).toHaveLength(2);
    expect(result).toContain(focusHighPriority);
    expect(result).toContain(focusCarryOver);
  });

  it("excludes low-priority pending tasks without carry-over from focus", () => {
    const result = getFilterTasks(tasks, "focus");

    expect(result).not.toContain(pending);
  });

  it("returns all tasks for 'all' filter", () => {
    const result = getFilterTasks(tasks, "all");

    expect(result).toHaveLength(4);
  });
});

// ─── getTaskTone ────────────────────────────────────────────

describe("getTaskTone", () => {
  it("returns emerald for done tasks", () => {
    expect(getTaskTone(aTask({ status: "done" }))).toContain("emerald");
  });

  it("returns red for stuck tasks (carry-over >= 3)", () => {
    expect(getTaskTone(aTask({ carryOverCount: 3 }))).toContain("red");
  });

  it("returns amber for tasks with carry-over > 0", () => {
    expect(getTaskTone(aTask({ carryOverCount: 1 }))).toContain("amber");
  });

  it("returns amber for high priority tasks", () => {
    expect(getTaskTone(aTask({ priority: 3 }))).toContain("amber");
  });

  it("returns glass/neutral for normal pending tasks", () => {
    expect(getTaskTone(aTask({ priority: 2, carryOverCount: 0 }))).toContain("glass-border");
  });
});

// ─── getPlanningToneClasses ─────────────────────────────────

describe("getPlanningToneClasses", () => {
  it("returns emerald for success", () => {
    expect(getPlanningToneClasses("success")).toContain("emerald");
  });

  it("returns amber for warning", () => {
    expect(getPlanningToneClasses("warning")).toContain("amber");
  });

  it("returns red for error", () => {
    expect(getPlanningToneClasses("error")).toContain("red");
  });

  it("returns violet for info", () => {
    expect(getPlanningToneClasses("info")).toContain("violet");
  });
});

// ─── formatTaskDate ─────────────────────────────────────────

describe("formatTaskDate", () => {
  it("formats a date string in es-AR locale", () => {
    const result = formatTaskDate("2026-03-23");

    expect(result).toContain("23");
    expect(result).toContain("mar");
  });
});

// ─── noteTypeLabel ──────────────────────────────────────────

describe("noteTypeLabel", () => {
  it("returns Paso for breakdown_step", () => {
    expect(noteTypeLabel("breakdown_step")).toBe("Paso");
  });

  it("returns Bloqueo for blocker", () => {
    expect(noteTypeLabel("blocker")).toBe("Bloqueo");
  });

  it("returns Nota for note", () => {
    expect(noteTypeLabel("note")).toBe("Nota");
  });
});

// ─── noteTypeTone ───────────────────────────────────────────

describe("noteTypeTone", () => {
  it("returns violet for breakdown_step", () => {
    expect(noteTypeTone("breakdown_step")).toContain("violet");
  });

  it("returns red for blocker", () => {
    expect(noteTypeTone("blocker")).toContain("red");
  });

  it("returns glass/neutral for note", () => {
    expect(noteTypeTone("note")).toContain("glass-border");
  });
});

// ─── buildPlanningSignals ───────────────────────────────────

describe("buildPlanningSignals", () => {
  describe("tone", () => {
    it("returns error when there are stuck tasks", () => {
      const result = buildPlanningSignals({
        pendingTasks: [aTask()],
        urgentTasks: [],
        stuckTasks: [aTask({ carryOverCount: 3 })],
      });

      expect(result.tone).toBe("error");
      expect(result.headline).toBe("Plan cargado al limite");
    });

    it("returns error when carry-over rate >= 50", () => {
      const result = buildPlanningSignals({
        pendingTasks: [aTask()],
        urgentTasks: [],
        stuckTasks: [],
        carryOverRate: 50,
      });

      expect(result.tone).toBe("error");
    });

    it("returns error when pending tasks >= 8", () => {
      const pending = Array.from({ length: 8 }, () => aTask());
      const result = buildPlanningSignals({
        pendingTasks: pending,
        urgentTasks: [],
        stuckTasks: [],
      });

      expect(result.tone).toBe("error");
    });

    it("returns warning when urgent tasks >= 4", () => {
      const urgent = Array.from({ length: 4 }, () => aTask({ priority: 3 }));
      const result = buildPlanningSignals({
        pendingTasks: [aTask()],
        urgentTasks: urgent,
        stuckTasks: [],
      });

      expect(result.tone).toBe("warning");
      expect(result.headline).toBe("Plan con presion");
    });

    it("returns warning when carry-over rate >= 35", () => {
      const result = buildPlanningSignals({
        pendingTasks: [aTask()],
        urgentTasks: [],
        stuckTasks: [],
        carryOverRate: 35,
      });

      expect(result.tone).toBe("warning");
    });

    it("returns warning when pending tasks >= 5", () => {
      const pending = Array.from({ length: 5 }, () => aTask());
      const result = buildPlanningSignals({
        pendingTasks: pending,
        urgentTasks: [],
        stuckTasks: [],
      });

      expect(result.tone).toBe("warning");
    });

    it("returns success when no pending tasks", () => {
      const result = buildPlanningSignals({
        pendingTasks: [],
        urgentTasks: [],
        stuckTasks: [],
      });

      expect(result.tone).toBe("success");
      expect(result.headline).toBe("Plan liviano");
    });

    it("returns info for a normal manageable load", () => {
      const result = buildPlanningSignals({
        pendingTasks: [aTask(), aTask()],
        urgentTasks: [],
        stuckTasks: [],
      });

      expect(result.tone).toBe("info");
      expect(result.headline).toBe("Plan controlable");
    });
  });

  describe("focusTasks", () => {
    it("selects tasks with priority >= 2", () => {
      const high = aTask({ priority: 3, title: "high" });
      const low = aTask({ priority: 1, title: "low" });

      const result = buildPlanningSignals({
        pendingTasks: [high, low],
        urgentTasks: [],
        stuckTasks: [],
      });

      expect(result.focusTasks).toHaveLength(1);
      expect(result.focusTasks[0].title).toBe("high");
    });

    it("selects tasks with carry-over > 0 regardless of priority", () => {
      const carried = aTask({ priority: 1, carryOverCount: 2, title: "carried" });

      const result = buildPlanningSignals({
        pendingTasks: [carried],
        urgentTasks: [],
        stuckTasks: [],
      });

      expect(result.focusTasks).toHaveLength(1);
      expect(result.focusTasks[0].title).toBe("carried");
    });

    it("limits focus tasks to 3", () => {
      const tasks = Array.from({ length: 5 }, (_, i) =>
        aTask({ priority: 3, title: `task-${i}` }),
      );

      const result = buildPlanningSignals({
        pendingTasks: tasks,
        urgentTasks: [],
        stuckTasks: [],
      });

      expect(result.focusTasks).toHaveLength(3);
    });
  });

  describe("recommendations", () => {
    it("warns about artificial volume when no pending tasks", () => {
      const result = buildPlanningSignals({
        pendingTasks: [],
        urgentTasks: [],
        stuckTasks: [],
      });

      expect(result.recommendations[0]).toContain("No agregues volumen artificial");
    });

    it("suggests focus limit when there are pending tasks", () => {
      const result = buildPlanningSignals({
        pendingTasks: [aTask({ priority: 2 })],
        urgentTasks: [],
        stuckTasks: [],
      });

      expect(result.recommendations[0]).toContain("Limita el foco");
    });

    it("warns about carry-over when rate >= 35", () => {
      const result = buildPlanningSignals({
        pendingTasks: [aTask()],
        urgentTasks: [],
        stuckTasks: [],
        carryOverRate: 40,
      });

      expect(result.recommendations[1]).toContain("carry-over de 7 dias va en 40%");
    });

    it("mentions stuck tasks when present", () => {
      const result = buildPlanningSignals({
        pendingTasks: [aTask()],
        urgentTasks: [],
        stuckTasks: [aTask({ carryOverCount: 3 })],
      });

      expect(result.recommendations[2]).toContain("bloqueadas por carry-over");
    });

    it("mentions urgent tasks when no stuck tasks", () => {
      const result = buildPlanningSignals({
        pendingTasks: [aTask()],
        urgentTasks: [aTask({ priority: 3 })],
        stuckTasks: [],
      });

      expect(result.recommendations[2]).toContain("caliente");
    });

    it("shows no strong signals when calm", () => {
      const result = buildPlanningSignals({
        pendingTasks: [aTask({ priority: 1 })],
        urgentTasks: [],
        stuckTasks: [],
      });

      expect(result.recommendations[2]).toContain("No hay señales fuertes");
    });
  });
});

// ─── taskDomainOptions ──────────────────────────────────────

describe("taskDomainOptions", () => {
  it("has 6 options including the empty default", () => {
    expect(taskDomainOptions).toHaveLength(6);
    expect(taskDomainOptions[0].value).toBe("");
  });
});
