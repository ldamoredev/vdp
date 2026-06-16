import type { HabitCadence } from "@vdp/shared";

export interface HabitsViewModel {
  habits: HabitRowVM[];
  completedToday: number;
  inRhythm: number;
  total: number;
  showSummary: boolean;
  allDone: boolean;
  isLoading: boolean;
  error: boolean;
  newHabitName: string;
  newHabitCadence: HabitCadence;
  newHabitWeeklyTarget: number;
  showWeeklyTarget: boolean;
  isCreating: boolean;
  canCreate: boolean;
}

export interface HabitRowVM {
  id: string;
  displayName: string;
  completedToday: boolean;
  streak: number;
  showStreakBadge: boolean;
  cadenceLabel: string;
  progressLabel: string | null;
  streakLabel: string | null;
  busy: boolean;
}
