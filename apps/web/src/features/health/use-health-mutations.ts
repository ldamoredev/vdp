"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { healthApi } from "./health-api";
import { healthQueryKeys } from "./health-query-keys";

export function useHealthMutations() {
  const queryClient = useQueryClient();
  const [newHabitName, setNewHabitName] = useState("");

  function invalidateHabits() {
    void queryClient.invalidateQueries({ queryKey: healthQueryKeys.habits });
  }

  const createMutation = useMutation({
    mutationFn: healthApi.createHabit,
    onSuccess: () => {
      setNewHabitName("");
      invalidateHabits();
    },
  });

  const completeMutation = useMutation({
    mutationFn: (habitId: string) => healthApi.completeHabit(habitId),
    onSuccess: invalidateHabits,
  });

  const uncompleteMutation = useMutation({
    mutationFn: (habitId: string) => healthApi.uncompleteHabit(habitId),
    onSuccess: invalidateHabits,
  });

  const archiveMutation = useMutation({
    mutationFn: healthApi.archiveHabit,
    onSuccess: invalidateHabits,
  });

  function createHabit(event: React.FormEvent) {
    event.preventDefault();
    const name = newHabitName.trim();
    if (!name || createMutation.isPending) return;
    createMutation.mutate({ name });
  }

  function isHabitBusy(habitId: string) {
    return (
      (completeMutation.isPending && completeMutation.variables === habitId) ||
      (uncompleteMutation.isPending && uncompleteMutation.variables === habitId) ||
      (archiveMutation.isPending && archiveMutation.variables === habitId)
    );
  }

  return {
    newHabitName,
    setNewHabitName,
    isCreatingHabit: createMutation.isPending,
    createHabit,
    completeHabit: (habitId: string) => completeMutation.mutate(habitId),
    uncompleteHabit: (habitId: string) => uncompleteMutation.mutate(habitId),
    archiveHabit: (habitId: string) => archiveMutation.mutate(habitId),
    isHabitBusy,
  };
}
