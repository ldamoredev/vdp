import type { HabitOverview } from "@vdp/shared";

/**
 * Habit data (it reuses the wire shape) plus the collection logic the views
 * need. Spanish-facing labels (streakLabel) stay in the
 * presenter; this layer is presentation-free.
 */
export type Habit = HabitOverview;

export interface HabitsSummary {
  total: number;
  completedToday: number;
  pendingToday: number;
  inRhythm: number;
  pendingRhythm: number;
  allDone: boolean;
}

export function summarizeHabits(habits: readonly Habit[]): HabitsSummary {
  const completedToday = habits.filter((habit) => habit.completedToday).length;
  const inRhythm = habits.filter(isHabitInRhythm).length;
  return {
    total: habits.length,
    completedToday,
    pendingToday: habits.length - completedToday,
    inRhythm,
    pendingRhythm: habits.length - inRhythm,
    allDone: habits.length > 0 && inRhythm === habits.length,
  };
}

export function isHabitInRhythm(habit: Habit): boolean {
  return habit.periodCompletions >= habit.periodTarget;
}

/** Pending-period habits first (longest live streak on top), completed last. */
export function sortHabitsForToday(habits: readonly Habit[]): Habit[] {
  return [...habits].sort((left, right) => {
    const leftInRhythm = isHabitInRhythm(left);
    const rightInRhythm = isHabitInRhythm(right);
    if (leftInRhythm !== rightInRhythm) {
      return leftInRhythm ? 1 : -1;
    }
    if (left.completedToday !== right.completedToday) {
      return left.completedToday ? 1 : -1;
    }
    if (left.streak !== right.streak) {
      return right.streak - left.streak;
    }
    return left.name.localeCompare(right.name);
  });
}
