import type { TodayProjectHoursViewModel } from "@/ui/models/projects/TodayProjectHoursViewModel";

export type HomeTaskStatusTone = "pending" | "done";
export type HomeTransactionTone = "income" | "expense" | "transfer";
export type HomeInsightTone = "achievement" | "warning" | "suggestion";
export type HomeRhythmTone = "ok" | "watch" | "alert";

export interface HomeStatsViewModel {
  readonly tasksCompleted: number;
  readonly tasksTotal: number;
  readonly tasksPending: number;
  readonly tasksPct: number;
  readonly averageCompletion: number;
}

export interface HomeTodayTaskViewModel {
  readonly id: string;
  readonly title: string;
  readonly statusTone: HomeTaskStatusTone;
  readonly completed: boolean;
  readonly priorityLabel: string;
  readonly priorityBadgeClassName: string;
  readonly scheduledDateLabel: string;
  readonly busy: boolean;
}

export interface HomeTodayTasksViewModel {
  readonly tasks: readonly HomeTodayTaskViewModel[];
  readonly newTitle: string;
  readonly canCreate: boolean;
  readonly isCreating: boolean;
  readonly createError: string | null;
}

export interface HomeMorningPlanTaskViewModel {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly selected: boolean;
}

export interface HomeMorningPlanViewModel {
  readonly statusLabel: string;
  readonly summary: string;
  readonly projectHours: TodayProjectHoursViewModel;
  readonly carryOverTasks: readonly HomeMorningPlanTaskViewModel[];
  readonly carryOverCountLabel: string;
  readonly canConfirmCarryOvers: boolean;
  readonly isConfirmingCarryOvers: boolean;
  readonly focusOptions: readonly HomeMorningPlanTaskViewModel[];
  readonly focusTaskTitle: string | null;
  readonly plannedAtLabel: string | null;
  readonly isSavingFocus: boolean;
  readonly error: string | null;
}

export interface HomeRitualViewModel {
  readonly morning: HomeMorningPlanViewModel;
  readonly statusLabel: string;
  readonly href: string;
  readonly ctaLabel: string;
  readonly taskCount: number;
  readonly walletCount: number;
  readonly insightCount: number;
  readonly noteSummary?: string;
}

export interface HomeWalletTransactionViewModel {
  readonly id: string;
  readonly descriptionLabel: string;
  readonly dateLabel: string;
  readonly amountLabel: string;
  readonly tone: HomeTransactionTone;
}

export interface HomeWalletSnapshotViewModel {
  readonly isLoading: boolean;
  readonly netBalanceLabel: string;
  readonly incomeLabel: string;
  readonly expensesLabel: string;
  readonly transactionCountLabel: string;
  readonly activityLabel: string;
  readonly recentTransactions: readonly HomeWalletTransactionViewModel[];
}

export interface HomeSignalActionViewModel {
  readonly href: string;
  readonly label: string;
  readonly domainLabel: string;
}

export interface HomeSignalViewModel {
  readonly id: string;
  readonly tone: HomeInsightTone;
  readonly typeLabel: string;
  readonly domainLabel: string;
  readonly title: string;
  readonly message: string;
  readonly dateLabel: string;
  readonly periodLabel: string | null;
  readonly action: HomeSignalActionViewModel | null;
}

export interface HomeTrendDayViewModel {
  readonly date: string;
  readonly dateLabel: string;
  readonly completionRate: number;
  readonly barWidth: number;
}

export interface HomeRhythmDomainViewModel {
  readonly id: string;
  readonly label: string;
  readonly countLabel: string;
}

export interface HomeRhythmViewModel {
  readonly periodLabel: string;
  readonly rateLabel: string;
  readonly tone: HomeRhythmTone;
  readonly message: string;
  readonly domains: readonly HomeRhythmDomainViewModel[];
}

export interface HomeObjectiveViewModel {
  readonly id: string;
  readonly title: string;
  readonly periodLabel: string;
  readonly sourceLabel: string;
  readonly currentValueLabel: string;
  readonly targetValueLabel: string;
  readonly progressPercent: number;
  readonly progressLabel: string;
  readonly isCreatingTask: boolean;
}

export interface HomeObjectivesViewModel {
  readonly href: string;
  readonly countLabel: string;
  readonly items: readonly HomeObjectiveViewModel[];
}

export interface HomeViewModel {
  readonly title: string;
  readonly subtitle: string;
  readonly onlineLabel: string;
  readonly stats: HomeStatsViewModel;
  readonly todayTasks: HomeTodayTasksViewModel;
  readonly objectives: HomeObjectivesViewModel;
  readonly ritual: HomeRitualViewModel;
  readonly wallet: HomeWalletSnapshotViewModel;
  readonly signals: readonly HomeSignalViewModel[];
  readonly signalCountLabel: string;
  readonly trend: readonly HomeTrendDayViewModel[];
  readonly rhythm: HomeRhythmViewModel;
}
