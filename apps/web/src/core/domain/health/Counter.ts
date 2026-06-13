import type { CounterOverview } from "@vdp/shared";

/**
 * A "days since" abstinence counter. Plain data (it reuses the wire shape) plus
 * its collection ordering. Spanish-facing labels (contextLabel) stay in the
 * presenter; this layer is presentation-free.
 */
export type Counter = CounterOverview;

/** Longest-running counters first — they carry the most at stake. */
export function sortCounters(counters: readonly Counter[]): Counter[] {
  return [...counters].sort((left, right) => {
    if (left.currentDays !== right.currentDays) {
      return right.currentDays - left.currentDays;
    }
    return left.name.localeCompare(right.name);
  });
}
