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

// ─── Counters ("days since") ─────────────────────────────

export interface Counter {
  id: string;
  name: string;
  emoji: string | null;
  /** Estimated daily cost in ARS; enables the money-not-spent estimate. */
  dailyCost: string | null;
  /** Start date (YYYY-MM-DD) of the current attempt. */
  startedAt: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CounterOverview extends Counter {
  /** Full days elapsed in the current attempt (day 0 = started today). */
  currentDays: number;
  bestDays: number;
  /** Total attempts including the current one. */
  attemptCount: number;
  moneyNotSpent: string | null;
}

export interface CountersOverviewResponse {
  counters: CounterOverview[];
  date: string;
}

// ─── Goals with deadlines ────────────────────────────────

export type GoalStatus = "active" | "done" | "dropped";

export interface Goal {
  id: string;
  title: string;
  notes: string | null;
  targetDate: string;
  status: GoalStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalOverview extends Goal {
  /** Days until the target date; negative when overdue. */
  daysLeft: number;
}

export interface GoalsOverviewResponse {
  goals: GoalOverview[];
  date: string;
}

export interface GraduateGoalResponse {
  goal: Goal;
  habit: Habit;
}
