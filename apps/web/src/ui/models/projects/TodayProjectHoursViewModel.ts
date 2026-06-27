export interface TodayProjectHoursRowViewModel {
  readonly projectId: string;
  readonly projectOutcome: string;
  readonly clientLabel: string | null;
  readonly durationLabel: string;
  readonly minutes: number;
}

export interface TodayProjectHoursViewModel {
  readonly title: string;
  readonly summary: string;
  readonly totalLabel: string;
  readonly emptyLabel: string;
  readonly hasEntries: boolean;
  readonly rows: readonly TodayProjectHoursRowViewModel[];
}
