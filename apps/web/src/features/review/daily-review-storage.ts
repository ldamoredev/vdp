import type { DailyReviewState } from "./daily-review-types";

const STORAGE_KEY = "daily-review-state";

export function createEmptyDailyReviewState(date: string): DailyReviewState {
  return {
    date,
    acknowledgedSignalIds: [],
    watchedCategoryIds: [],
    note: "",
    openedAt: null,
    completedAt: null,
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
  };
}

export function loadDailyReviewState(date: string): DailyReviewState {
  const base = createEmptyDailyReviewState(date);

  if (typeof window === "undefined") {
    return base;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return base;

  try {
    const parsed = JSON.parse(raw) as Partial<DailyReviewState>;
    return mergePersistedDailyReviewState(base, parsed);
  } catch {
    return base;
  }
}

export function saveDailyReviewState(state: DailyReviewState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
