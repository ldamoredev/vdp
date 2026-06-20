import type { Task as TaskDto } from "@vdp/shared";
import { describe, expect, it } from "vitest";

import { buildPlanningSignal } from "../PlanningSignal";
import { Task } from "../Task";

function task(overrides: Partial<TaskDto> = {}): Task {
  return Task.from({
    id: "t1",
    title: "Tarea",
    description: null,
    priority: 1,
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

describe("buildPlanningSignal", () => {
  it("classifies an empty day as success", () => {
    const signal = buildPlanningSignal({ tasks: [] });

    expect(signal.tone).toBe("success");
    expect(signal.pendingCount).toBe(0);
    expect(signal.urgentCount).toBe(0);
    expect(signal.focusTasks).toEqual([]);
  });

  it("classifies normal open work as info", () => {
    const signal = buildPlanningSignal({ tasks: [task(), task({ id: "t2", status: "in_progress" })] });

    expect(signal.tone).toBe("info");
    expect(signal.pendingCount).toBe(2);
  });

  it("classifies pressure as warning", () => {
    const signal = buildPlanningSignal({
      tasks: Array.from({ length: 4 }, (_, index) => task({ id: `t${index}`, priority: 3 })),
    });

    expect(signal.tone).toBe("warning");
    expect(signal.urgentCount).toBe(4);
  });

  it("classifies overloaded or stuck work as error", () => {
    expect(buildPlanningSignal({ tasks: [task({ carryOverCount: 3 })] }).tone).toBe("error");
    expect(buildPlanningSignal({ tasks: [task()], carryOverRate: 50 }).tone).toBe("error");
    expect(
      buildPlanningSignal({
        tasks: Array.from({ length: 8 }, (_, index) => task({ id: `t${index}` })),
      }).tone,
    ).toBe("error");
  });

  it("selects up to three focus tasks from open hot work", () => {
    const signal = buildPlanningSignal({
      tasks: [
        task({ id: "low", priority: 1 }),
        task({ id: "done", status: "done", priority: 3 }),
        task({ id: "progress", status: "in_progress", priority: 3 }),
        task({ id: "high", priority: 3 }),
        task({ id: "medium", priority: 2 }),
        task({ id: "carried", priority: 1, carryOverCount: 1 }),
        task({ id: "extra", priority: 3 }),
      ],
    });

    expect(signal.focusTasks.map((item) => item.id)).toEqual(["progress", "high", "medium"]);
  });
});
