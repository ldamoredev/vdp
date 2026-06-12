import { describe, expect, it } from "vitest";
import type { CounterOverview, HabitOverview } from "@/lib/api/types";
import {
  buildHabitsSummary,
  counterContextLabel,
  sortCounters,
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

function counter(overrides: Partial<CounterOverview> = {}): CounterOverview {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? "Sin fumar",
    emoji: null,
    dailyCost: overrides.dailyCost ?? null,
    startedAt: overrides.startedAt ?? "2026-06-01",
    archivedAt: null,
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
    currentDays: overrides.currentDays ?? 0,
    bestDays: overrides.bestDays ?? 0,
    attemptCount: overrides.attemptCount ?? 1,
    moneyNotSpent: overrides.moneyNotSpent ?? null,
  };
}

describe("sortCounters", () => {
  it("puts the longest-running counter first", () => {
    const sorted = sortCounters([
      counter({ name: "Corto", currentDays: 2 }),
      counter({ name: "Largo", currentDays: 90 }),
    ]);

    expect(sorted.map((c) => c.name)).toEqual(["Largo", "Corto"]);
  });
});

describe("counterContextLabel", () => {
  it("shows the start date on a first attempt", () => {
    expect(counterContextLabel(counter({ currentDays: 10, startedAt: "2026-06-02" }))).toBe(
      "desde 2026-06-02",
    );
    expect(counterContextLabel(counter({ currentDays: 0 }))).toBe("Arrancó hoy");
  });

  it("shows the best attempt after relapses", () => {
    expect(
      counterContextLabel(counter({ currentDays: 3, bestDays: 42, attemptCount: 3 })),
    ).toBe("mejor intento: 42 · intento #3");
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
