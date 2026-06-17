// ─── Health API response types ───────────────────────────

export type HabitCadence = "daily" | "weekly";

export interface Habit {
  id: string;
  name: string;
  emoji: string | null;
  cadence: HabitCadence;
  /** Required when cadence is weekly; null for daily habits. */
  weeklyTarget: number | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HabitOverview extends Habit {
  completedToday: boolean;
  /** Current period progress: today for daily habits, current week for weekly habits. */
  periodCompletions: number;
  periodTarget: number;
  /** Consecutive-day or consecutive-week run that is still alive. */
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
  targetWeightKg: string | null;
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

// ─── Daily mood/energy check-ins ────────────────────────

export interface MoodCheckIn {
  id: string;
  date: string;
  mood: number;
  energy: number;
  createdAt: string;
  updatedAt: string;
}

export interface MoodCheckInSummary {
  days: number;
  checkInCount: number;
  averageMood: number | null;
  averageEnergy: number | null;
  habitCompletionRate: number;
}

export interface MoodCheckInsResponse {
  checkIns: MoodCheckIn[];
  date: string;
  summary: MoodCheckInSummary;
}

// ─── Weight trend ───────────────────────────────────────

export interface WeightEntry {
  id: string;
  date: string;
  /** Body weight in kilograms, stored as a decimal string. */
  weightKg: string;
  createdAt: string;
  updatedAt: string;
}

export type WeightTrendDirection = "up" | "down" | "flat";

export interface WeightTrendSummary {
  days: number;
  entryCount: number;
  currentWeightKg: string | null;
  previousWeightKg: string | null;
  changeKg: string | null;
  direction: WeightTrendDirection;
}

export interface WeightTrendResponse {
  entries: WeightEntry[];
  date: string;
  summary: WeightTrendSummary;
}
