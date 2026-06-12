"use client";

import { useQuery } from "@tanstack/react-query";
import { healthApi } from "./health-api";
import { healthQueryKeys } from "./health-query-keys";
import { buildHabitsSummary, sortActiveGoals, sortCounters, sortHabitsForToday } from "./health-selectors";

export function useHealthQueries() {
  const habitsQuery = useQuery({
    queryKey: healthQueryKeys.habits,
    queryFn: healthApi.getHabits,
  });

  const countersQuery = useQuery({
    queryKey: healthQueryKeys.counters,
    queryFn: healthApi.getCounters,
  });

  const goalsQuery = useQuery({
    queryKey: healthQueryKeys.goals,
    queryFn: healthApi.getGoals,
  });

  const habits = sortHabitsForToday(habitsQuery.data?.habits ?? []);

  return {
    habits,
    summary: buildHabitsSummary(habits),
    date: habitsQuery.data?.date,
    isLoadingHabits: habitsQuery.isLoading,
    habitsError: habitsQuery.isError,
    counters: sortCounters(countersQuery.data?.counters ?? []),
    isLoadingCounters: countersQuery.isLoading,
    countersError: countersQuery.isError,
    goals: sortActiveGoals(goalsQuery.data?.goals ?? []),
    isLoadingGoals: goalsQuery.isLoading,
    goalsError: goalsQuery.isError,
  };
}
