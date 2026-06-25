import type { DailyReviewState } from "./daily-review-types";

/**
 * Pure helpers for the review's ceremony state. Persistence moved server-side
 * (R1): the presenters hydrate via `GetDailyReviewState` and persist via
 * `SaveDailyReviewState` over the Core bus, so the ritual is shared across
 * devices. `mergePersistedDailyReviewState` reconciles a possibly-partial
 * server record onto a fresh empty state; there is no localStorage path left.
 */
export function createEmptyDailyReviewState(date: string): DailyReviewState {
  return {
    date,
    acknowledgedSignalIds: [],
    watchedCategoryIds: [],
    note: "",
    openedAt: null,
    completedAt: null,
    focusTaskId: null,
    plannedAt: null,
  };
}

export function mergePersistedDailyReviewState(
  base: DailyReviewState,
  persisted?: Partial<DailyReviewState> | null,
): DailyReviewState {
  if (!persisted || persisted.date !== base.date) {
    return base;
  }

  return {
    ...base,
    acknowledgedSignalIds: Array.isArray(persisted.acknowledgedSignalIds)
      ? persisted.acknowledgedSignalIds
      : base.acknowledgedSignalIds,
    watchedCategoryIds: Array.isArray(persisted.watchedCategoryIds)
      ? persisted.watchedCategoryIds
      : base.watchedCategoryIds,
    note: typeof persisted.note === "string" ? persisted.note : base.note,
    openedAt:
      typeof persisted.openedAt === "string" || persisted.openedAt === null
        ? (persisted.openedAt ?? base.openedAt)
        : base.openedAt,
    completedAt:
      typeof persisted.completedAt === "string" || persisted.completedAt === null
        ? (persisted.completedAt ?? base.completedAt)
        : base.completedAt,
    focusTaskId:
      typeof persisted.focusTaskId === "string" || persisted.focusTaskId === null
        ? (persisted.focusTaskId ?? base.focusTaskId)
        : base.focusTaskId,
    plannedAt:
      typeof persisted.plannedAt === "string" || persisted.plannedAt === null
        ? (persisted.plannedAt ?? base.plannedAt)
        : base.plannedAt,
  };
}
