"use client";

import { useQuery } from "@tanstack/react-query";
import { healthApi } from "./health-api";
import { healthQueryKeys } from "./health-query-keys";
import { buildHabitsSummary, sortHabitsForToday } from "./health-selectors";

export function useHealthQueries() {
  const habitsQuery = useQuery({
    queryKey: healthQueryKeys.habits,
    queryFn: healthApi.getHabits,
  });

  const habits = sortHabitsForToday(habitsQuery.data?.habits ?? []);

  return {
    habits,
    summary: buildHabitsSummary(habits),
    date: habitsQuery.data?.date,
    isLoadingHabits: habitsQuery.isLoading,
    habitsError: habitsQuery.isError,
  };
}
