import { describe, expect, it } from "vitest";
import {
  createEmptyDailyReviewState,
  mergePersistedDailyReviewState,
} from "../daily-review-storage";

describe("mergePersistedDailyReviewState", () => {
  it("keeps only the current review date and preserves acknowledged work", () => {
    const base = createEmptyDailyReviewState("2026-04-10");
    const result = mergePersistedDailyReviewState(base, {
      date: "2026-04-10",
      acknowledgedSignalIds: ["wallet:uncategorized"],
      watchedCategoryIds: ["cat-food"],
      note: "Mirar gastos chicos",
    });

    expect(result.acknowledgedSignalIds).toEqual(["wallet:uncategorized"]);
    expect(result.watchedCategoryIds).toEqual(["cat-food"]);
    expect(result.note).toBe("Mirar gastos chicos");
  });
});
