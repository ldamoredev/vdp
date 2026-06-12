"use client";

import { createContext, type ReactNode } from "react";
import type { CounterOverview, HabitOverview } from "@/lib/api/types";
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
  };

  return (
    <HealthQueriesContext.Provider value={queriesValue}>
      <HealthActionsContext.Provider value={actionsValue}>
        {children}
      </HealthActionsContext.Provider>
    </HealthQueriesContext.Provider>
  );
}
