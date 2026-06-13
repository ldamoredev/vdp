import type { GoalOverview, GoalStatus } from "@vdp/shared";

export type GoalUrgency = "overdue" | "soon" | "calm";

/**
 * A deadline-bound goal. Rich model: it owns the urgency/active classification
 * that the views used to read off raw fields. Spanish-facing labels stay in the
 * presenter — this layer is presentation-free. `daysLeft` is computed by the
 * backend (negative when overdue) and carried through.
 */
export class Goal {
  private constructor(
    readonly id: string,
    readonly title: string,
    readonly notes: string | null,
    readonly targetDate: string,
    readonly status: GoalStatus,
    readonly completedAt: string | null,
    readonly daysLeft: number,
  ) {}

  static from(dto: GoalOverview): Goal {
    return new Goal(
      dto.id,
      dto.title,
      dto.notes,
      dto.targetDate,
      dto.status,
      dto.completedAt,
      dto.daysLeft,
    );
  }

  get isActive(): boolean {
    return this.status === "active";
  }

  get isOverdue(): boolean {
    return this.daysLeft < 0;
  }

  urgency(): GoalUrgency {
    if (this.isOverdue) return "overdue";
    if (this.daysLeft <= 7) return "soon";
    return "calm";
  }
}

/** Active goals only, most urgent first (overdue on top, then closest deadline). */
export function sortActiveGoals(goals: readonly Goal[]): Goal[] {
  return goals
    .filter((goal) => goal.isActive)
    .sort((left, right) => {
      if (left.daysLeft !== right.daysLeft) {
        return left.daysLeft - right.daysLeft;
      }
      return left.title.localeCompare(right.title);
    });
}
