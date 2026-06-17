import { describe, expect, it } from "vitest";

import { sortWeightEntries, type WeightEntry } from "../Weight";

function entry(date: string, weightKg: string): WeightEntry {
  return {
    id: date,
    date,
    weightKg,
    createdAt: "",
    updatedAt: "",
  };
}

describe("weight domain helpers", () => {
  it("sorts entries by date without mutating the input", () => {
    const entries = [entry("2026-06-14", "82.1"), entry("2026-06-10", "83.4")];

    const sorted = sortWeightEntries(entries);

    expect(sorted.map((item) => item.date)).toEqual(["2026-06-10", "2026-06-14"]);
    expect(entries.map((item) => item.date)).toEqual(["2026-06-14", "2026-06-10"]);
  });

});
