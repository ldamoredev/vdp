"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { getTodayISO } from "@/lib/format";
import { tasksQueryKeys } from "./tasks-query-keys";
import {
  buildPlanningSignals,
  getFilterTasks,
  sortExecutionQueue,
  taskDomainOptions,
  type TaskFilter,
} from "./tasks-dashboard-selectors";

export function useTasksQueries() {
  const today = getTodayISO();
  const [filter, setFilter] = useState<TaskFilter>("focus");

  const { data: tasksResult } = useQuery({
    queryKey: tasksQueryKeys.list(today),
    queryFn: () => tasksApi.getTasks({ scheduledDate: today }),
  });

  const { data: todayStats } = useQuery({
    queryKey: tasksQueryKeys.todayStats,
    queryFn: tasksApi.getTodayStats,
  });

  const { data: review } = useQuery({
    queryKey: tasksQueryKeys.review(today),
    queryFn: () => tasksApi.getReview(today),
  });

  const { data: trend } = useQuery({
    queryKey: tasksQueryKeys.trend(7),
    queryFn: () => tasksApi.getTrend(7),
  });

  const { data: carryOverRate } = useQuery({
    queryKey: tasksQueryKeys.carryOverRate(7),
    queryFn: () => tasksApi.getCarryOverRate(7),
  });

  const tasks = sortExecutionQueue(tasksResult?.tasks || []);
  const pendingTasks = tasks.filter((task) => task.status === "pending");
  const doneTasks = tasks.filter((task) => task.status === "done");
  const visibleTasks = getFilterTasks(tasks, filter);
  const urgentTasks = pendingTasks.filter(
    (task) => task.priority === 3 || task.carryOverCount > 0,
  );
  const stuckTasks = pendingTasks.filter((task) => task.carryOverCount >= 3);
  const topTask = visibleTasks[0] || pendingTasks[0];
  const completionAverage = trend?.length
    ? Math.round(
        trend.reduce((acc, day) => acc + day.completionRate, 0) / trend.length,
      )
    : 0;
  const planning = buildPlanningSignals({
    pendingTasks,
    urgentTasks,
    stuckTasks,
    carryOverRate: carryOverRate?.rate,
  });

  return {
    today,
    domainOptions: taskDomainOptions,
    tasks,
    pendingTasks,
    doneTasks,
    visibleTasks,
    urgentTasks,
    stuckTasks,
    topTask,
    completionAverage,
    planning,
    review,
    trend,
    todayStats,
    carryOverRate,
    filter,
    setFilter,
  };
}
