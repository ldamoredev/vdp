export interface HistoryViewModel {
  header: HistoryHeaderVM;
  signals: HistorySignalVM[];
  closureQueue: HistoryClosureQueueVM;
  sidebar: HistorySidebarVM;
  trend: HistoryTrendVM | null;
  domainStats: HistoryDomainStatsVM | null;
  isLoading: boolean;
  error: boolean;
}

export interface HistoryHeaderVM {
  eyebrow: string;
  title: string;
  description: string;
  dateLabel: string;
  isToday: boolean;
  metrics: HistoryMetricVM[];
}

export interface HistoryMetricVM {
  label: string;
  value: string;
  className: string;
}

export interface HistorySignalVM {
  title: string;
  detail: string;
  toneClass: string;
}

export interface HistoryClosureQueueVM {
  title: string;
  description: string;
  nextDateLabel: string;
  canCarryOverAll: boolean;
  isCarryingOverAll: boolean;
  emptyState: HistoryEmptyStateVM | null;
  items: HistoryClosureTaskVM[];
}

export interface HistoryClosureTaskVM {
  id: string;
  title: string;
  priority: number;
  domain: string | null;
  carryOverCount: number;
  carryOverLabel: string | null;
  stuckLabel: string | null;
  decisionText: string;
  carryOverActionLabel: string;
  busy: boolean;
}

export interface HistoryEmptyStateVM {
  title: string;
  description: string;
}

export interface HistorySidebarVM {
  status: {
    title: string;
    metrics: HistoryMetricVM[];
  };
  completed: HistoryTaskListVM;
  discarded: HistoryTaskListVM;
}

export interface HistoryTaskListVM {
  title: string;
  count: number;
  emptyText: string;
  items: HistorySidebarTaskVM[];
}

export interface HistorySidebarTaskVM {
  id: string;
  title: string;
  priority: number;
  domain: string | null;
}

export interface HistoryTrendVM {
  title: string;
  description: string;
  days: HistoryTrendDayVM[];
}

export interface HistoryTrendDayVM {
  date: string;
  dayLabel: string;
  completionRateLabel: string;
  heightPercent: number;
  selected: boolean;
}

export interface HistoryDomainStatsVM {
  title: string;
  description: string;
  items: HistoryDomainStatVM[];
}

export interface HistoryDomainStatVM {
  key: string;
  domain: string | null;
  domainLabel: string;
  domainClassName: string;
  completedLabel: string;
  totalLabel: string;
  rate: number;
  rateLabel: string;
}
