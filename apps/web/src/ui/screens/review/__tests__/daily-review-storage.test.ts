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
      focusTaskId: "focus-1",
      plannedAt: "2026-04-10T09:00:00.000Z",
      morningBriefRequestedAt: "2026-04-10T07:00:00.000Z",
      eveningBriefRequestedAt: null,
    });

    expect(result.acknowledgedSignalIds).toEqual(["wallet:uncategorized"]);
    expect(result.watchedCategoryIds).toEqual(["cat-food"]);
    expect(result.note).toBe("Mirar gastos chicos");
    expect(result.focusTaskId).toBe("focus-1");
    expect(result.plannedAt).toBe("2026-04-10T09:00:00.000Z");
    expect(result.morningBriefRequestedAt).toBe("2026-04-10T07:00:00.000Z");
    expect(result.eveningBriefRequestedAt).toBeNull();
  });

  it("defaults both brief-requested fields to null for a fresh state", () => {
    const empty = createEmptyDailyReviewState("2026-04-10");

    expect(empty.morningBriefRequestedAt).toBeNull();
    expect(empty.eveningBriefRequestedAt).toBeNull();
  });
});
