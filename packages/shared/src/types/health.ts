// ─── Health API response types ───────────────────────────

export interface Habit {
  id: string;
  name: string;
  emoji: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HabitOverview extends Habit {
  completedToday: boolean;
  /** Consecutive-day run that is still alive (ends today or yesterday). */
  streak: number;
  bestStreak: number;
  totalCompletions: number;
  lastCompletedDate: string | null;
}

export interface HabitsOverviewResponse {
  habits: HabitOverview[];
  date: string;
}
