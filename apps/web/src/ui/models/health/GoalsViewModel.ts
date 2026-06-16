import type { GoalUrgency } from "@/core/domain/health/Goal";
import type { HabitCadence } from "@vdp/shared";

export interface GoalsViewModel {
  goals: GoalRowVM[];
  isLoading: boolean;
  error: boolean;
  newTitle: string;
  newTargetDate: string;
  isCreating: boolean;
  canCreate: boolean;
  graduation: GraduationVM | null;
}

export interface GoalRowVM {
  id: string;
  title: string;
  targetDateLabel: string;
  deadlineLabel: string;
  urgency: GoalUrgency;
  busy: boolean;
}

export interface GraduationVM {
  goalId: string;
  habitName: string;
  cadence: HabitCadence;
  weeklyTarget: number;
  showWeeklyTarget: boolean;
  isGraduating: boolean;
}
