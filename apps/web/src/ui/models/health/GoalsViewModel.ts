import type { GoalUrgency } from "@/core/domain/health/Goal";

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
  isGraduating: boolean;
}
