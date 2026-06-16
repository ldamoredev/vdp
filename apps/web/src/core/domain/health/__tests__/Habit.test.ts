import type { HabitOverview } from "@vdp/shared";
import { describe, expect, it } from "vitest";

import { summarizeHabits, sortHabitsForToday, type Habit } from "../Habit";

function habit(overrides: Partial<HabitOverview> = {}): Habit {
  return {
    id: "h1",
    name: "Meditar",
    emoji: null,
    cadence: "daily",
    weeklyTarget: null,
    archivedAt: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    completedToday: false,
    periodCompletions: 0,
    periodTarget: 1,
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
      habit({ completedToday: true, periodCompletions: 1 }),
      habit({ completedToday: false }),
      habit({ completedToday: true, periodCompletions: 1 }),
    ]);
    expect(summary).toEqual({
      total: 3,
      completedToday: 2,
      pendingToday: 1,
      inRhythm: 2,
      pendingRhythm: 1,
      allDone: false,
    });
  });

  it("is allDone only when every habit is done and there is at least one", () => {
    expect(summarizeHabits([]).allDone).toBe(false);
    expect(summarizeHabits([habit({ completedToday: true, periodCompletions: 1 })]).allDone).toBe(true);
    expect(summarizeHabits([habit({ completedToday: false })]).allDone).toBe(false);
  });

  it("counts weekly habits as in rhythm when the weekly target is met", () => {
    const summary = summarizeHabits([
      habit({ completedToday: false, cadence: "weekly", weeklyTarget: 3, periodCompletions: 3, periodTarget: 3 }),
      habit({ completedToday: true, periodCompletions: 1 }),
    ]);

    expect(summary.completedToday).toBe(1);
    expect(summary.inRhythm).toBe(2);
    expect(summary.allDone).toBe(true);
  });
});

describe("sortHabitsForToday", () => {
  it("puts pending before completed, longest streak first, then name", () => {
    const habits = [
      habit({ id: "done-hi", name: "Z", completedToday: true, periodCompletions: 1, streak: 9 }),
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
    const habits = [habit({ id: "a", completedToday: true, periodCompletions: 1 }), habit({ id: "b" })];
    sortHabitsForToday(habits);
    expect(habits.map((h) => h.id)).toEqual(["a", "b"]);
  });
});
