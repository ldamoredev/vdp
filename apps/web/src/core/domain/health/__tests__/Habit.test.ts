import type { HabitOverview } from "@vdp/shared";
import { describe, expect, it } from "vitest";

import { summarizeHabits, sortHabitsForToday, type Habit } from "../Habit";

function habit(overrides: Partial<HabitOverview> = {}): Habit {
  return {
    id: "h1",
    name: "Meditar",
    emoji: null,
    archivedAt: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    completedToday: false,
    streak: 0,
    bestStreak: 0,
    totalCompletions: 0,
    lastCompletedDate: null,
    ...overrides,
  };
}

describe("summarizeHabits", () => {
  it("counts completed vs pending for today", () => {
    const summary = summarizeHabits([
      habit({ completedToday: true }),
      habit({ completedToday: false }),
      habit({ completedToday: true }),
    ]);
    expect(summary).toEqual({ total: 3, completedToday: 2, pendingToday: 1, allDone: false });
  });

  it("is allDone only when every habit is done and there is at least one", () => {
    expect(summarizeHabits([]).allDone).toBe(false);
    expect(summarizeHabits([habit({ completedToday: true })]).allDone).toBe(true);
    expect(summarizeHabits([habit({ completedToday: false })]).allDone).toBe(false);
  });
});

describe("sortHabitsForToday", () => {
  it("puts pending before completed, longest streak first, then name", () => {
    const habits = [
      habit({ id: "done-hi", name: "Z", completedToday: true, streak: 9 }),
      habit({ id: "pending-lo", name: "Beta", completedToday: false, streak: 1 }),
      habit({ id: "pending-hi", name: "Alpha", completedToday: false, streak: 5 }),
      habit({ id: "pending-tie", name: "Aaa", completedToday: false, streak: 5 }),
    ];

    expect(sortHabitsForToday(habits).map((h) => h.id)).toEqual([
      "pending-tie",
      "pending-hi",
      "pending-lo",
      "done-hi",
    ]);
  });

  it("does not mutate the input array", () => {
    const habits = [habit({ id: "a", completedToday: true }), habit({ id: "b" })];
    sortHabitsForToday(habits);
    expect(habits.map((h) => h.id)).toEqual(["a", "b"]);
  });
});
