export interface SidebarCardsViewModel {
  nextBestAction: NextBestActionVM;
  recovery: RecoveryBoardVM;
  weeklyRhythm: WeeklyRhythmVM;
}

export interface NextBestActionVM {
  title: string;
  task: NextBestActionTaskVM | null;
  emptyText: string | null;
}

export interface NextBestActionTaskVM {
  id: string;
  eyebrow: string;
  title: string;
  priority: number;
  domain: string | null;
  reason: string;
}

export interface RecoveryBoardVM {
  title: string;
  metrics: RecoveryMetricVM[];
}

export interface RecoveryMetricVM {
  label: string;
  value: string;
  className: string;
}

export interface WeeklyRhythmVM {
  title: string;
  days: WeeklyRhythmDayVM[];
  emptyText: string | null;
}

export interface WeeklyRhythmDayVM {
  date: string;
  dateLabel: string;
  completionRateLabel: string;
  heightPercent: number;
  today: boolean;
  barClassName: string;
}
