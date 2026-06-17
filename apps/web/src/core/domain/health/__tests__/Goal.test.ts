import type { GoalOverview } from "@vdp/shared";
import { describe, expect, it } from "vitest";

import { Goal, sortActiveGoals } from "../Goal";

function goalDto(overrides: Partial<GoalOverview> = {}): GoalOverview {
  return {
    id: "g1",
    title: "Empezar el gym",
    notes: null,
    targetDate: "2026-07-01",
    targetWeightKg: null,
    status: "active",
    completedAt: null,
    daysLeft: 10,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("Goal", () => {
  it("is active only when its status is active", () => {
    expect(Goal.from(goalDto({ status: "active" })).isActive).toBe(true);
    expect(Goal.from(goalDto({ status: "done" })).isActive).toBe(false);
    expect(Goal.from(goalDto({ status: "dropped" })).isActive).toBe(false);
  });

  it("is overdue when daysLeft is negative", () => {
    expect(Goal.from(goalDto({ daysLeft: -1 })).isOverdue).toBe(true);
    expect(Goal.from(goalDto({ daysLeft: 0 })).isOverdue).toBe(false);
  });

  it("classifies urgency by daysLeft", () => {
    expect(Goal.from(goalDto({ daysLeft: -2 })).urgency()).toBe("overdue");
    expect(Goal.from(goalDto({ daysLeft: 0 })).urgency()).toBe("soon");
    expect(Goal.from(goalDto({ daysLeft: 7 })).urgency()).toBe("soon");
    expect(Goal.from(goalDto({ daysLeft: 8 })).urgency()).toBe("calm");
  });
});

describe("sortActiveGoals", () => {
  it("drops non-active goals, puts overdue first, then closest deadline", () => {
    const goals = [
      Goal.from(goalDto({ id: "calm", title: "Calm", daysLeft: 20 })),
      Goal.from(goalDto({ id: "done", title: "Done", status: "done", daysLeft: -5 })),
      Goal.from(goalDto({ id: "overdue", title: "Overdue", daysLeft: -3 })),
      Goal.from(goalDto({ id: "soon", title: "Soon", daysLeft: 2 })),
    ];

    expect(sortActiveGoals(goals).map((g) => g.id)).toEqual(["overdue", "soon", "calm"]);
  });

  it("breaks daysLeft ties by title", () => {
    const goals = [
      Goal.from(goalDto({ id: "b", title: "Beta", daysLeft: 5 })),
      Goal.from(goalDto({ id: "a", title: "Alpha", daysLeft: 5 })),
    ];

    expect(sortActiveGoals(goals).map((g) => g.id)).toEqual(["a", "b"]);
  });

  it("does not mutate the input array", () => {
    const goals = [
      Goal.from(goalDto({ id: "x", daysLeft: 9 })),
      Goal.from(goalDto({ id: "y", daysLeft: 1 })),
    ];
    const snapshot = goals.map((g) => g.id);

    sortActiveGoals(goals);

    expect(goals.map((g) => g.id)).toEqual(snapshot);
  });
});
