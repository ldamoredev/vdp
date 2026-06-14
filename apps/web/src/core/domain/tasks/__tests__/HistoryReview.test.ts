import type { Task as TaskDto } from "@vdp/shared";
import { describe, expect, it } from "vitest";

import { Task } from "../Task";
import { buildHistoryReviewSignals } from "../HistoryReview";

function task(overrides: Partial<TaskDto> = {}): Task {
  return Task.from({
    id: "t1",
    title: "Cerrar review",
    description: null,
    priority: 2,
    status: "pending",
    scheduledDate: "2026-06-13",
    domain: null,
    carryOverCount: 0,
    completedAt: null,
    createdAt: "2026-06-13T08:00:00.000Z",
    updatedAt: "2026-06-13T08:00:00.000Z",
    ...overrides,
  });
}

describe("HistoryReview", () => {
  it("marks a day with no pending tasks as clean", () => {
    const signals = buildHistoryReviewSignals({
      pending: 0,
      completionRate: 100,
      pendingTasks: [],
    });

    expect(signals).toEqual([{ kind: "clean_close", tone: "success" }]);
  });

  it("marks an overloaded day when pending count is high or completion is low", () => {
    const byVolume = buildHistoryReviewSignals({
      pending: 5,
      completionRate: 80,
      pendingTasks: [task()],
    });
    const byCompletion = buildHistoryReviewSignals({
      pending: 1,
      completionRate: 40,
      pendingTasks: [task()],
    });

    expect(byVolume[0]).toEqual({ kind: "overloaded_day", tone: "warning" });
    expect(byCompletion[0]).toEqual({ kind: "overloaded_day", tone: "warning" });
  });

  it("adds a stuck signal when pending tasks have too much carry-over", () => {
    const signals = buildHistoryReviewSignals({
      pending: 2,
      completionRate: 70,
      pendingTasks: [task({ carryOverCount: 3 }), task({ id: "t2", carryOverCount: 1 })],
    });

    expect(signals).toEqual([
      { kind: "recoverable_close", tone: "info" },
      { kind: "stuck_tasks", tone: "error", count: 1 },
    ]);
  });
});
