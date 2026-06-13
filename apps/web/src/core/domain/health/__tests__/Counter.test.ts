import type { CounterOverview } from "@vdp/shared";
import { describe, expect, it } from "vitest";

import { sortCounters, type Counter } from "../Counter";

function counter(overrides: Partial<CounterOverview> = {}): Counter {
  return {
    id: "c1",
    name: "Sin fumar",
    emoji: null,
    dailyCost: null,
    startedAt: "2026-01-01",
    archivedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    currentDays: 0,
    bestDays: 0,
    attemptCount: 1,
    moneyNotSpent: null,
    ...overrides,
  };
}

describe("sortCounters", () => {
  it("orders by longest current run, then name", () => {
    const counters = [
      counter({ id: "short", name: "Z", currentDays: 3 }),
      counter({ id: "long", name: "Y", currentDays: 90 }),
      counter({ id: "tie-b", name: "Beta", currentDays: 10 }),
      counter({ id: "tie-a", name: "Alpha", currentDays: 10 }),
    ];

    expect(sortCounters(counters).map((c) => c.id)).toEqual(["long", "tie-a", "tie-b", "short"]);
  });

  it("does not mutate the input array", () => {
    const counters = [counter({ id: "a", currentDays: 1 }), counter({ id: "b", currentDays: 9 })];
    sortCounters(counters);
    expect(counters.map((c) => c.id)).toEqual(["a", "b"]);
  });
});
