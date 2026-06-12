import type { CounterOverview, GoalOverview, HabitOverview } from "@/lib/api/types";

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

/** Active goals only, most urgent first (overdue on top, then closest deadline). */
export function sortActiveGoals(goals: readonly GoalOverview[]): GoalOverview[] {
  return goals
    .filter((goal) => goal.status === "active")
    .sort((left, right) => {
      if (left.daysLeft !== right.daysLeft) {
        return left.daysLeft - right.daysLeft;
      }
      return left.title.localeCompare(right.title);
    });
}

export type GoalUrgency = "overdue" | "soon" | "calm";

export function goalUrgency(goal: GoalOverview): GoalUrgency {
  if (goal.daysLeft < 0) return "overdue";
  if (goal.daysLeft <= 7) return "soon";
  return "calm";
}

export function goalDeadlineLabel(goal: GoalOverview): string {
  if (goal.daysLeft < 0) {
    const days = Math.abs(goal.daysLeft);
    return `venció hace ${days} día${days === 1 ? "" : "s"}`;
  }
  if (goal.daysLeft === 0) return "vence hoy";
  if (goal.daysLeft === 1) return "vence mañana";
  return `${goal.daysLeft} días`;
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
