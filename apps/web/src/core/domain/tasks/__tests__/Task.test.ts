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
  it("reflects status with isPending/isInProgress/isOpen/isDone", () => {
    expect(Task.from(taskDto({ status: "pending" })).isPending).toBe(true);
    expect(Task.from(taskDto({ status: "in_progress" })).isInProgress).toBe(true);
    expect(Task.from(taskDto({ status: "pending" })).isOpen).toBe(true);
    expect(Task.from(taskDto({ status: "in_progress" })).isOpen).toBe(true);
    expect(Task.from(taskDto({ status: "done" })).isDone).toBe(true);
    expect(Task.from(taskDto({ status: "discarded" })).isOpen).toBe(false);
  });

  it("is stuck once carried over 3+ times", () => {
    expect(Task.from(taskDto({ carryOverCount: 2 })).isStuck).toBe(false);
    expect(Task.from(taskDto({ carryOverCount: 3 })).isStuck).toBe(true);
  });

  it("is hot when open and high-priority or already carried over", () => {
    expect(Task.from(taskDto({ priority: 2 })).isHot).toBe(true);
    expect(Task.from(taskDto({ status: "in_progress", priority: 2 })).isHot).toBe(true);
    expect(Task.from(taskDto({ priority: 1, carryOverCount: 1 })).isHot).toBe(true);
    expect(Task.from(taskDto({ priority: 1, carryOverCount: 0 })).isHot).toBe(false);
    expect(Task.from(taskDto({ status: "done", priority: 3 })).isHot).toBe(false);
  });
});

describe("sortExecutionQueue", () => {
  it("orders open tasks before terminal ones, most carried-over, then priority, then age", () => {
    const tasks = [
      Task.from(taskDto({ id: "done", status: "done", priority: 3 })),
      Task.from(taskDto({ id: "old-low", priority: 1, createdAt: "2026-06-13T07:00:00.000Z" })),
      Task.from(taskDto({ id: "progress", status: "in_progress", priority: 2 })),
      Task.from(taskDto({ id: "carried", carryOverCount: 2 })),
      Task.from(taskDto({ id: "hi-prio", priority: 3 })),
    ];

    expect(sortExecutionQueue(tasks).map((t) => t.id)).toEqual([
      "carried",
      "hi-prio",
      "progress",
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
    Task.from(taskDto({ id: "progress", status: "in_progress", priority: 2 })),
    Task.from(taskDto({ id: "hot", priority: 3 })),
    Task.from(taskDto({ id: "done", status: "done" })),
  ];

  it("focus keeps only hot open tasks", () => {
    expect(filterTasks(tasks, "focus").map((t) => t.id)).toEqual(["progress", "hot"]);
  });

  it("pending keeps open tasks, done filters by status, all returns a copy", () => {
    expect(filterTasks(tasks, "pending").map((t) => t.id)).toEqual(["pending-plain", "progress", "hot"]);
    expect(filterTasks(tasks, "done").map((t) => t.id)).toEqual(["done"]);
    expect(filterTasks(tasks, "all")).toHaveLength(4);
  });
});
