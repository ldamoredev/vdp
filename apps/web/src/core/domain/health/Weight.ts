import type { WeightEntry as WireWeightEntry, WeightTrendResponse } from "@vdp/shared";

export type WeightEntry = WireWeightEntry;
export type WeightTrend = WeightTrendResponse;

export function sortWeightEntries(entries: readonly WeightEntry[]): WeightEntry[] {
  return [...entries].sort((left, right) => left.date.localeCompare(right.date));
}
