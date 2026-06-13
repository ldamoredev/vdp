import { createContext, type ReactNode } from "react";
import type { CounterOverview, GoalOverview, HabitOverview } from "@/lib/api/types";
import type { HabitsSummary } from "./health-selectors";
import { useHealthQueries } from "./use-health-queries";
import { useHealthMutations } from "./use-health-mutations";

export interface HealthQueriesValue {
  habits: HabitOverview[];
  summary: HabitsSummary;
  date: string | undefined;
  isLoadingHabits: boolean;
  habitsError: boolean;
  newHabitName: string;
  isCreatingHabit: boolean;
  counters: CounterOverview[];
  isLoadingCounters: boolean;
  countersError: boolean;
  newCounterName: string;
  newCounterDailyCost: string;
  newCounterStartedAt: string;
  isCreatingCounter: boolean;
  goals: GoalOverview[];
  isLoadingGoals: boolean;
  goalsError: boolean;
  newGoalTitle: string;
  newGoalTargetDate: string;
  isCreatingGoal: boolean;
  graduationOffer: { goalId: string; title: string } | null;
  isGraduating: boolean;
}

export interface HealthActionsValue {
  setNewHabitName: (value: string) => void;
  createHabit: (event: React.FormEvent) => void;
  completeHabit: (habitId: string) => void;
  uncompleteHabit: (habitId: string) => void;
  archiveHabit: (habitId: string) => void;
  isHabitBusy: (habitId: string) => boolean;
  setNewCounterName: (value: string) => void;
  setNewCounterDailyCost: (value: string) => void;
  setNewCounterStartedAt: (value: string) => void;
  createCounter: (event: React.FormEvent) => void;
  relapseCounter: (counterId: string) => void;
  archiveCounter: (counterId: string) => void;
  isCounterBusy: (counterId: string) => boolean;
  setNewGoalTitle: (value: string) => void;
  setNewGoalTargetDate: (value: string) => void;
  createGoal: (event: React.FormEvent) => void;
  completeGoal: (goalId: string) => void;
  dropGoal: (goalId: string) => void;
  isGoalBusy: (goalId: string) => boolean;
  graduateGoal: (goalId: string, habitName: string) => void;
  dismissGraduationOffer: () => void;
}

export const HealthQueriesContext = createContext<HealthQueriesValue | null>(null);
export const HealthActionsContext = createContext<HealthActionsValue | null>(null);

export function HealthProvider({ children }: { children: ReactNode }) {
  const queries = useHealthQueries();
  const mutations = useHealthMutations();

  const queriesValue: HealthQueriesValue = {
    habits: queries.habits,
    summary: queries.summary,
    date: queries.date,
    isLoadingHabits: queries.isLoadingHabits,
    habitsError: queries.habitsError,
    newHabitName: mutations.newHabitName,
    isCreatingHabit: mutations.isCreatingHabit,
    counters: queries.counters,
    isLoadingCounters: queries.isLoadingCounters,
    countersError: queries.countersError,
    newCounterName: mutations.newCounterName,
    newCounterDailyCost: mutations.newCounterDailyCost,
    newCounterStartedAt: mutations.newCounterStartedAt,
    isCreatingCounter: mutations.isCreatingCounter,
    goals: queries.goals,
    isLoadingGoals: queries.isLoadingGoals,
    goalsError: queries.goalsError,
    newGoalTitle: mutations.newGoalTitle,
    newGoalTargetDate: mutations.newGoalTargetDate,
    isCreatingGoal: mutations.isCreatingGoal,
    graduationOffer: mutations.graduationOffer,
    isGraduating: mutations.isGraduating,
  };

  const actionsValue: HealthActionsValue = {
    setNewHabitName: mutations.setNewHabitName,
    createHabit: mutations.createHabit,
    completeHabit: mutations.completeHabit,
    uncompleteHabit: mutations.uncompleteHabit,
    archiveHabit: mutations.archiveHabit,
    isHabitBusy: mutations.isHabitBusy,
    setNewCounterName: mutations.setNewCounterName,
    setNewCounterDailyCost: mutations.setNewCounterDailyCost,
    setNewCounterStartedAt: mutations.setNewCounterStartedAt,
    createCounter: mutations.createCounter,
    relapseCounter: mutations.relapseCounter,
    archiveCounter: mutations.archiveCounter,
    isCounterBusy: mutations.isCounterBusy,
    setNewGoalTitle: mutations.setNewGoalTitle,
    setNewGoalTargetDate: mutations.setNewGoalTargetDate,
    createGoal: mutations.createGoal,
    completeGoal: mutations.completeGoal,
    dropGoal: mutations.dropGoal,
    isGoalBusy: mutations.isGoalBusy,
    graduateGoal: mutations.graduateGoal,
    dismissGraduationOffer: mutations.dismissGraduationOffer,
  };

  return (
    <HealthQueriesContext.Provider value={queriesValue}>
      <HealthActionsContext.Provider value={actionsValue}>
        {children}
      </HealthActionsContext.Provider>
    </HealthQueriesContext.Provider>
  );
}
