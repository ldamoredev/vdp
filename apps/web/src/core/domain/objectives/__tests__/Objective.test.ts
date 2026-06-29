import { describe, expect, it } from "vitest";

import { Objective, sortObjectives } from "../Objective";

function objective(overrides: Partial<Parameters<typeof Objective.from>[0]> = {}): Objective {
  return Objective.from({
    id: "o1",
    title: "120 horas",
    periodStart: "2026-07-01",
    periodEnd: "2026-09-30",
    metricSource: "projects_hours",
    metricTargetId: null,
    target: 120,
    unit: "h",
    manualValue: null,
    currency: null,
    status: "active",
    archivedAt: null,
    achievedAt: null,
    createdAt: "2026-06-28T10:00:00.000Z",
    updatedAt: "2026-06-28T10:00:00.000Z",
    ...overrides,
  });
}

describe("Objective", () => {
  it("maps DTOs and exposes lifecycle classification", () => {
    const active = objective();
    const archived = objective({ id: "archived", status: "archived" });

    expect(active.isActive).toBe(true);
    expect(archived.isActive).toBe(false);
  });

  it("sorts active objectives first without mutating the input", () => {
    const archived = objective({ id: "archived", status: "archived", updatedAt: "2026-06-29T10:00:00.000Z" });
    const active = objective({ id: "active", status: "active", updatedAt: "2026-06-28T10:00:00.000Z" });
    const input = [archived, active];

    const sorted = sortObjectives(input);

    expect(sorted.map((item) => item.id)).toEqual(["active", "archived"]);
    expect(input.map((item) => item.id)).toEqual(["archived", "active"]);
  });
});
