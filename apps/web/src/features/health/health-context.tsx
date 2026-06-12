"use client";

import { createContext, type ReactNode } from "react";
import type { HabitOverview } from "@/lib/api/types";
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
}

export interface HealthActionsValue {
  setNewHabitName: (value: string) => void;
  createHabit: (event: React.FormEvent) => void;
  completeHabit: (habitId: string) => void;
  uncompleteHabit: (habitId: string) => void;
  archiveHabit: (habitId: string) => void;
  isHabitBusy: (habitId: string) => boolean;
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
  };

  const actionsValue: HealthActionsValue = {
    setNewHabitName: mutations.setNewHabitName,
    createHabit: mutations.createHabit,
    completeHabit: mutations.completeHabit,
    uncompleteHabit: mutations.uncompleteHabit,
    archiveHabit: mutations.archiveHabit,
    isHabitBusy: mutations.isHabitBusy,
  };

  return (
    <HealthQueriesContext.Provider value={queriesValue}>
      <HealthActionsContext.Provider value={actionsValue}>
        {children}
      </HealthActionsContext.Provider>
    </HealthQueriesContext.Provider>
  );
}
