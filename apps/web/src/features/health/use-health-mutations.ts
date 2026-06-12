"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { healthApi } from "./health-api";
import { healthQueryKeys } from "./health-query-keys";

export function useHealthMutations() {
  const queryClient = useQueryClient();
  const [newHabitName, setNewHabitName] = useState("");
  const [newCounterName, setNewCounterName] = useState("");
  const [newCounterDailyCost, setNewCounterDailyCost] = useState("");
  const [newCounterStartedAt, setNewCounterStartedAt] = useState("");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTargetDate, setNewGoalTargetDate] = useState("");
  const [graduationOffer, setGraduationOffer] = useState<{ goalId: string; title: string } | null>(null);

  function invalidateHabits() {
    void queryClient.invalidateQueries({ queryKey: healthQueryKeys.habits });
  }

  function invalidateCounters() {
    void queryClient.invalidateQueries({ queryKey: healthQueryKeys.counters });
  }

  function invalidateGoals() {
    void queryClient.invalidateQueries({ queryKey: healthQueryKeys.goals });
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

  const createCounterMutation = useMutation({
    mutationFn: healthApi.createCounter,
    onSuccess: () => {
      setNewCounterName("");
      setNewCounterDailyCost("");
      setNewCounterStartedAt("");
      invalidateCounters();
    },
  });

  const relapseMutation = useMutation({
    mutationFn: (counterId: string) => healthApi.relapseCounter(counterId),
    onSuccess: () => {
      invalidateCounters();
      // A relapse can be followed by milestone/money insights elsewhere.
      void queryClient.invalidateQueries({ queryKey: ["home", "tasks", "insights"] });
    },
  });

  const archiveCounterMutation = useMutation({
    mutationFn: healthApi.archiveCounter,
    onSuccess: invalidateCounters,
  });

  const createGoalMutation = useMutation({
    mutationFn: healthApi.createGoal,
    onSuccess: () => {
      setNewGoalTitle("");
      setNewGoalTargetDate("");
      invalidateGoals();
    },
  });

  const completeGoalMutation = useMutation({
    mutationFn: healthApi.completeGoal,
    onSuccess: (goal) => {
      invalidateGoals();
      // The graduation loop: offer turning the won goal into a daily habit.
      setGraduationOffer({ goalId: goal.id, title: goal.title });
    },
  });

  const dropGoalMutation = useMutation({
    mutationFn: healthApi.dropGoal,
    onSuccess: invalidateGoals,
  });

  const graduateGoalMutation = useMutation({
    mutationFn: ({ goalId, habitName }: { goalId: string; habitName: string }) =>
      healthApi.graduateGoal(goalId, { habitName }),
    onSuccess: () => {
      setGraduationOffer(null);
      invalidateGoals();
      void queryClient.invalidateQueries({ queryKey: healthQueryKeys.habits });
    },
  });

  function createCounter(event: React.FormEvent) {
    event.preventDefault();
    const name = newCounterName.trim();
    if (!name || createCounterMutation.isPending) return;

    const dailyCost = newCounterDailyCost.trim();
    createCounterMutation.mutate({
      name,
      dailyCost: dailyCost ? dailyCost : null,
      startedAt: newCounterStartedAt || undefined,
    });
  }

  function isHabitBusy(habitId: string) {
    return (
      (completeMutation.isPending && completeMutation.variables === habitId) ||
      (uncompleteMutation.isPending && uncompleteMutation.variables === habitId) ||
      (archiveMutation.isPending && archiveMutation.variables === habitId)
    );
  }

  function createGoal(event: React.FormEvent) {
    event.preventDefault();
    const title = newGoalTitle.trim();
    if (!title || !newGoalTargetDate || createGoalMutation.isPending) return;
    createGoalMutation.mutate({ title, targetDate: newGoalTargetDate });
  }

  function isGoalBusy(goalId: string) {
    return (
      (completeGoalMutation.isPending && completeGoalMutation.variables === goalId) ||
      (dropGoalMutation.isPending && dropGoalMutation.variables === goalId) ||
      (graduateGoalMutation.isPending && graduateGoalMutation.variables?.goalId === goalId)
    );
  }

  function isCounterBusy(counterId: string) {
    return (
      (relapseMutation.isPending && relapseMutation.variables === counterId) ||
      (archiveCounterMutation.isPending && archiveCounterMutation.variables === counterId)
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
    newCounterName,
    setNewCounterName,
    newCounterDailyCost,
    setNewCounterDailyCost,
    newCounterStartedAt,
    setNewCounterStartedAt,
    isCreatingCounter: createCounterMutation.isPending,
    createCounter,
    relapseCounter: (counterId: string) => relapseMutation.mutate(counterId),
    archiveCounter: (counterId: string) => archiveCounterMutation.mutate(counterId),
    isCounterBusy,
    newGoalTitle,
    setNewGoalTitle,
    newGoalTargetDate,
    setNewGoalTargetDate,
    isCreatingGoal: createGoalMutation.isPending,
    createGoal,
    completeGoal: (goalId: string) => completeGoalMutation.mutate(goalId),
    dropGoal: (goalId: string) => dropGoalMutation.mutate(goalId),
    isGoalBusy,
    graduationOffer,
    dismissGraduationOffer: () => setGraduationOffer(null),
    graduateGoal: (goalId: string, habitName: string) =>
      graduateGoalMutation.mutate({ goalId, habitName }),
    isGraduating: graduateGoalMutation.isPending,
  };
}
