import { describe, it, expect } from "vitest";
import type { Task } from "@/lib/api/types";
import { getReviewSignals, getSignalToneClasses } from "../history-selectors";

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

describe("getReviewSignals", () => {
  it("returns clean close when no pending tasks", () => {
    const signals = getReviewSignals({
      pending: 0,
      completionRate: 100,
      pendingTasks: [],
    });

    expect(signals).toHaveLength(1);
    expect(signals[0].title).toBe("Cierre limpio");
    expect(signals[0].tone).toBe("success");
  });

  it("returns overloaded warning when pending count is high", () => {
    const signals = getReviewSignals({
      pending: 5,
      completionRate: 80,
      pendingTasks: [aTask(), aTask(), aTask(), aTask(), aTask()],
    });

    expect(signals).toHaveLength(2);
    expect(signals[0].title).toBe("Dia sobrecargado");
    expect(signals[0].tone).toBe("warning");
  });

  it("returns overloaded warning when completion rate is below fifty percent", () => {
    const signals = getReviewSignals({
      pending: 2,
      completionRate: 40,
      pendingTasks: [aTask(), aTask()],
    });

    expect(signals[0].title).toBe("Dia sobrecargado");
    expect(signals[0].tone).toBe("warning");
  });

  it("returns recoverable close when pending is manageable", () => {
    const signals = getReviewSignals({
      pending: 3,
      completionRate: 70,
      pendingTasks: [aTask(), aTask(), aTask()],
    });

    expect(signals[0].title).toBe("Cierre recuperable");
    expect(signals[0].tone).toBe("info");
  });

  it("flags stuck tasks with error tone when carry over count is three or more", () => {
    const signals = getReviewSignals({
      pending: 2,
      completionRate: 70,
      pendingTasks: [
        aTask({ carryOverCount: 3 }),
        aTask({ carryOverCount: 1 }),
      ],
    });

    expect(signals[1].title).toBe("Hay tareas bloqueadas");
    expect(signals[1].tone).toBe("error");
    expect(signals[1].detail).toContain("1 tarea arrastra");
  });

  it("pluralizes stuck tasks detail when multiple are stuck", () => {
    const signals = getReviewSignals({
      pending: 3,
      completionRate: 70,
      pendingTasks: [
        aTask({ carryOverCount: 4 }),
        aTask({ carryOverCount: 5 }),
        aTask({ carryOverCount: 0 }),
      ],
    });

    expect(signals[1].detail).toContain("2 tareas arrastran");
  });

  it("returns no-blockage success when no tasks are stuck", () => {
    const signals = getReviewSignals({
      pending: 2,
      completionRate: 70,
      pendingTasks: [aTask({ carryOverCount: 1 }), aTask({ carryOverCount: 2 })],
    });

    expect(signals[1].title).toBe("Sin bloqueo cronico");
    expect(signals[1].tone).toBe("success");
  });

  it("combines overloaded and stuck signals together", () => {
    const signals = getReviewSignals({
      pending: 6,
      completionRate: 30,
      pendingTasks: [
        aTask({ carryOverCount: 5 }),
        aTask({ carryOverCount: 3 }),
        aTask(),
        aTask(),
        aTask(),
        aTask(),
      ],
    });

    expect(signals).toHaveLength(2);
    expect(signals[0].tone).toBe("warning");
    expect(signals[1].tone).toBe("error");
  });
});

describe("getSignalToneClasses", () => {
  it("returns emerald classes for success", () => {
    const classes = getSignalToneClasses("success");
    expect(classes).toContain("emerald");
  });

  it("returns amber classes for warning", () => {
    const classes = getSignalToneClasses("warning");
    expect(classes).toContain("amber");
  });

  it("returns red classes for error", () => {
    const classes = getSignalToneClasses("error");
    expect(classes).toContain("red");
  });

  it("returns violet classes for info", () => {
    const classes = getSignalToneClasses("info");
    expect(classes).toContain("violet");
  });
});
