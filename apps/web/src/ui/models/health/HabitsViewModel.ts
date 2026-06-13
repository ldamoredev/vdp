export interface HabitsViewModel {
  habits: HabitRowVM[];
  completedToday: number;
  total: number;
  showSummary: boolean;
  allDone: boolean;
  isLoading: boolean;
  error: boolean;
  newHabitName: string;
  isCreating: boolean;
  canCreate: boolean;
}

export interface HabitRowVM {
  id: string;
  displayName: string;
  completedToday: boolean;
  streak: number;
  showStreakBadge: boolean;
  streakLabel: string | null;
  busy: boolean;
}
