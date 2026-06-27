import type { TaskInsight } from "@/lib/api/types";
import type { Transaction } from "@/core/domain/wallet/Transaction";
import type { TodayProjectHoursViewModel } from "@/ui/models/projects/TodayProjectHoursViewModel";
import type { WalletReviewSignal } from "@/ui/screens/review/daily-review-types";

export interface ReviewTaskItemVM {
  id: string;
  title: string;
  detail: string;
  carryOverCount: number;
}

export interface ReviewWatchedCategoryVM {
  id: string;
  name: string;
  watched: boolean;
}

export interface ReviewScoreOptionVM {
  value: number;
  label: string;
  selected: boolean;
}

export interface ReviewViewModel {
  dateLabel: string;
  progressLabel: string;
  taskQueue: ReviewTaskItemVM[];
  projectHours: TodayProjectHoursViewModel;
  mood: {
    selectedMood: number | null;
    selectedEnergy: number | null;
    moodOptions: ReviewScoreOptionVM[];
    energyOptions: ReviewScoreOptionVM[];
    isSaving: boolean;
    error: string | null;
    weeklyInsight: string;
    summary: string;
  };
  wallet: {
    signals: WalletReviewSignal[];
    transactions: Transaction[];
    summary?: string;
  };
  insights: TaskInsight[];
  decisions: {
    categories: ReviewWatchedCategoryVM[];
    note: string;
    summary: string;
  };
  editSheet: {
    transaction: Transaction | null;
    open: boolean;
  };
}
