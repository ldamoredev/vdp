"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, subDays } from "date-fns";
import { tasksApi } from "@/lib/api/tasks";
import { syncTaskQueryState } from "@/lib/tasks/chat-sync";
import { getReviewSignals } from "./history-selectors";

function toISO(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function useHistoryModel() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const dateISO = toISO(selectedDate);
  const nextReviewDate = addDays(selectedDate, 1);
  const nextReviewISO = toISO(nextReviewDate);
  const isToday = dateISO === toISO(new Date());

  const { data: reviewResult } = useQuery({
    queryKey: ["tasks", "review", dateISO],
    queryFn: () => tasksApi.getReview(dateISO),
  });

  const { data: tasksResult } = useQuery({
    queryKey: ["tasks", dateISO, "all"],
    queryFn: () => tasksApi.getTasks({ scheduledDate: dateISO }),
  });

  const { data: trend } = useQuery({
    queryKey: ["tasks", "trend", 14],
    queryFn: () => tasksApi.getTrend(14),
  });

  const { data: domainStats } = useQuery({
    queryKey: ["tasks", "domain-stats"],
    queryFn: () => tasksApi.getByDomain(),
  });

  const carryOverMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.carryOverTask(taskId, nextReviewISO),
    onSuccess: (task) =>
      syncTaskQueryState({
        tool: "carry_over_task",
        parsedResult: task,
        queryClient,
      }),
  });

  const discardMutation = useMutation({
    mutationFn: tasksApi.discardTask,
    onSuccess: (task) =>
      syncTaskQueryState({
        tool: "discard_task",
        parsedResult: task,
        queryClient,
      }),
  });

  const carryOverAllMutation = useMutation({
    mutationFn: () => tasksApi.carryOverAll(dateISO, nextReviewISO),
    onSuccess: (result) =>
      syncTaskQueryState({
        tool: "carry_over_all_pending",
        parsedResult: result,
        input: { fromDate: dateISO, toDate: nextReviewISO },
        queryClient,
      }),
  });

  const review = reviewResult;
  const tasks = tasksResult?.tasks || [];
  const completedTasks = tasks.filter((task) => task.status === "done");
  const pendingTasks = review?.pendingTasks || tasks.filter((task) => task.status === "pending");
  const discardedTasks = tasks.filter((task) => task.status === "discarded");
  const reviewSignals = review
    ? getReviewSignals({
        pending: review.pending,
        completionRate: review.completionRate,
        pendingTasks,
      })
    : [];

  function goBack() {
    setSelectedDate((d) => subDays(d, 1));
  }

  function goForward() {
    if (!isToday) setSelectedDate((d) => addDays(d, 1));
  }

  const isTaskBusy = (taskId: string) =>
    (carryOverMutation.isPending && carryOverMutation.variables === taskId) ||
    (discardMutation.isPending && discardMutation.variables === taskId);

  return {
    selectedDate,
    dateISO,
    nextReviewDate,
    isToday,
    review,
    trend,
    domainStats,
    completedTasks,
    pendingTasks,
    discardedTasks,
    reviewSignals,
    goBack,
    goForward,
    isTaskBusy,
    isCarryingOverAll: carryOverAllMutation.isPending,
    carryOverAll: () => carryOverAllMutation.mutate(),
    carryOverTask: (taskId: string) => carryOverMutation.mutate(taskId),
    discardTask: (taskId: string) => discardMutation.mutate(taskId),
  };
}
