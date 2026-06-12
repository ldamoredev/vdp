import type { CounterOverview, HabitOverview } from "@/lib/api/types";

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

/** Longest-running counters first — they carry the most at stake. */
export function sortCounters(counters: readonly CounterOverview[]): CounterOverview[] {
  return [...counters].sort((left, right) => {
    if (left.currentDays !== right.currentDays) {
      return right.currentDays - left.currentDays;
    }
    return left.name.localeCompare(right.name);
  });
}

export function counterContextLabel(counter: CounterOverview): string {
  const parts: string[] = [];

  if (counter.attemptCount > 1) {
    parts.push(`mejor intento: ${counter.bestDays}`);
    parts.push(`intento #${counter.attemptCount}`);
  }

  if (parts.length === 0) {
    return counter.currentDays === 0 ? "Arrancó hoy" : `desde ${counter.startedAt}`;
  }

  return parts.join(" · ");
}
