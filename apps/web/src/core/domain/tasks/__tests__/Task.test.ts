import type { Task as TaskDto } from "@vdp/shared";
import { describe, expect, it } from "vitest";

import { filterTasks, sortExecutionQueue, Task } from "../Task";

function taskDto(overrides: Partial<TaskDto> = {}): TaskDto {
  return {
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
  };
}

describe("Task", () => {
  it("reflects status with isPending/isDone", () => {
    expect(Task.from(taskDto({ status: "pending" })).isPending).toBe(true);
    expect(Task.from(taskDto({ status: "done" })).isDone).toBe(true);
    expect(Task.from(taskDto({ status: "discarded" })).isPending).toBe(false);
  });

  it("is stuck once carried over 3+ times", () => {
    expect(Task.from(taskDto({ carryOverCount: 2 })).isStuck).toBe(false);
    expect(Task.from(taskDto({ carryOverCount: 3 })).isStuck).toBe(true);
  });

  it("is hot when pending and high-priority or already carried over", () => {
    expect(Task.from(taskDto({ priority: 2 })).isHot).toBe(true);
    expect(Task.from(taskDto({ priority: 1, carryOverCount: 1 })).isHot).toBe(true);
    expect(Task.from(taskDto({ priority: 1, carryOverCount: 0 })).isHot).toBe(false);
    expect(Task.from(taskDto({ status: "done", priority: 3 })).isHot).toBe(false);
  });
});

describe("sortExecutionQueue", () => {
  it("orders pending before done, most carried-over, then priority, then age", () => {
    const tasks = [
      Task.from(taskDto({ id: "done", status: "done", priority: 3 })),
      Task.from(taskDto({ id: "old-low", priority: 1, createdAt: "2026-06-13T07:00:00.000Z" })),
      Task.from(taskDto({ id: "carried", carryOverCount: 2 })),
      Task.from(taskDto({ id: "hi-prio", priority: 3 })),
    ];

    expect(sortExecutionQueue(tasks).map((t) => t.id)).toEqual([
      "carried",
      "hi-prio",
      "old-low",
      "done",
    ]);
  });

  it("does not mutate the input", () => {
    const tasks = [Task.from(taskDto({ id: "a" })), Task.from(taskDto({ id: "b", status: "done" }))];
    sortExecutionQueue(tasks);
    expect(tasks.map((t) => t.id)).toEqual(["a", "b"]);
  });
});

describe("filterTasks", () => {
  const tasks = [
    Task.from(taskDto({ id: "pending-plain", priority: 1 })),
    Task.from(taskDto({ id: "hot", priority: 3 })),
    Task.from(taskDto({ id: "done", status: "done" })),
  ];

  it("focus keeps only hot pending tasks", () => {
    expect(filterTasks(tasks, "focus").map((t) => t.id)).toEqual(["hot"]);
  });

  it("pending and done filter by status; all returns a copy", () => {
    expect(filterTasks(tasks, "pending").map((t) => t.id)).toEqual(["pending-plain", "hot"]);
    expect(filterTasks(tasks, "done").map((t) => t.id)).toEqual(["done"]);
    expect(filterTasks(tasks, "all")).toHaveLength(3);
  });
});
