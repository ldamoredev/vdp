import type { GoalUrgency } from "@/core/domain/health/Goal";
import type { HabitCadence } from "@vdp/shared";

export interface GoalsViewModel {
  goals: GoalRowVM[];
  isLoading: boolean;
  error: boolean;
  newTitle: string;
  newTargetDate: string;
  newTargetWeight: string;
  isCreating: boolean;
  canCreate: boolean;
  graduation: GraduationVM | null;
}

export interface GoalRowVM {
  id: string;
  title: string;
  targetDateLabel: string;
  targetWeightLabel: string | null;
  deadlineLabel: string;
  urgency: GoalUrgency;
  busy: boolean;
  /** Cross-domain (D1b): this week's eating-out / delivery spend, shown on weight goals. */
  foodSpendingLabel: string | null;
  foodSpendingHref: string | null;
}

export interface GraduationVM {
  goalId: string;
  habitName: string;
  cadence: HabitCadence;
  weeklyTarget: number;
  showWeeklyTarget: boolean;
  isGraduating: boolean;
}
