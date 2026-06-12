import { describe, expect, it } from "vitest";
import type { HabitOverview } from "@/lib/api/types";
import {
  buildHabitsSummary,
  sortHabitsForToday,
  streakLabel,
} from "../health-selectors";

function habit(overrides: Partial<HabitOverview> = {}): HabitOverview {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? "Gimnasio",
    emoji: overrides.emoji ?? null,
    archivedAt: null,
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
    completedToday: overrides.completedToday ?? false,
    streak: overrides.streak ?? 0,
    bestStreak: overrides.bestStreak ?? 0,
    totalCompletions: overrides.totalCompletions ?? 0,
    lastCompletedDate: overrides.lastCompletedDate ?? null,
  };
}

describe("buildHabitsSummary", () => {
  it("counts completed and pending habits", () => {
    const summary = buildHabitsSummary([
      habit({ completedToday: true }),
      habit({ completedToday: false }),
      habit({ completedToday: false }),
    ]);

    expect(summary).toEqual({
      total: 3,
      completedToday: 1,
      pendingToday: 2,
      allDone: false,
    });
  });

  it("flags allDone only with at least one habit", () => {
    expect(buildHabitsSummary([]).allDone).toBe(false);
    expect(buildHabitsSummary([habit({ completedToday: true })]).allDone).toBe(true);
  });
});

describe("sortHabitsForToday", () => {
  it("puts pending first, longest streak on top, completed last", () => {
    const sorted = sortHabitsForToday([
      habit({ name: "Hecho", completedToday: true, streak: 10 }),
      habit({ name: "Corto", completedToday: false, streak: 1 }),
      habit({ name: "Largo", completedToday: false, streak: 8 }),
    ]);

    expect(sorted.map((h) => h.name)).toEqual(["Largo", "Corto", "Hecho"]);
  });

  it("does not mutate the input", () => {
    const input = [habit({ name: "b" }), habit({ name: "a" })];
    sortHabitsForToday(input);
    expect(input[0].name).toBe("b");
  });
});

describe("streakLabel", () => {
  it("describes live streaks", () => {
    expect(streakLabel(habit({ streak: 5 }))).toBe("5 días seguidos");
    expect(streakLabel(habit({ streak: 1, completedToday: true }))).toBe("Arrancó hoy");
  });

  it("falls back to the best streak after a break", () => {
    expect(streakLabel(habit({ streak: 0, bestStreak: 9 }))).toBe("Mejor racha: 9");
    expect(streakLabel(habit({ streak: 0, bestStreak: 1 }))).toBeNull();
  });
});
