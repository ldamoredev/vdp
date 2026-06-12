import type { HabitOverview } from "@/lib/api/types";

export type HabitsSummary = {
  total: number;
  completedToday: number;
  pendingToday: number;
  allDone: boolean;
};

export function buildHabitsSummary(habits: readonly HabitOverview[]): HabitsSummary {
  const completedToday = habits.filter((habit) => habit.completedToday).length;

  return {
    total: habits.length,
    completedToday,
    pendingToday: habits.length - completedToday,
    allDone: habits.length > 0 && completedToday === habits.length,
  };
}

/** Pending habits first (longest live streak on top), completed last. */
export function sortHabitsForToday(habits: readonly HabitOverview[]): HabitOverview[] {
  return [...habits].sort((left, right) => {
    if (left.completedToday !== right.completedToday) {
      return left.completedToday ? 1 : -1;
    }

    if (left.streak !== right.streak) {
      return right.streak - left.streak;
    }

    return left.name.localeCompare(right.name);
  });
}

export function streakLabel(habit: HabitOverview): string | null {
  if (habit.streak >= 2) return `${habit.streak} días seguidos`;
  if (habit.streak === 1 && habit.completedToday) return "Arrancó hoy";
  if (habit.bestStreak >= 3 && habit.streak === 0) return `Mejor racha: ${habit.bestStreak}`;
  return null;
}
