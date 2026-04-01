"use client";

import {
  TasksQueriesContext,
  TasksActionsContext,
  type TasksQueriesValue,
  type TasksActionsValue,
} from "./tasks-context";
import { useRequiredContext } from "@/lib/react/use-required-context";

/**
 * Access read-only task data (tasks, stats, planning, detail, creation state).
 * Must be used within a <TasksProvider>.
 */
export function useTasksData(): TasksQueriesValue {
  return useRequiredContext(TasksQueriesContext, "useTasksData", "TasksProvider");
}

/**
 * Access stable task action functions (mutations, setters, form handlers).
 * Must be used within a <TasksProvider>.
 * References are stable across renders — safe to use in dependency arrays.
 */
export function useTasksActions(): TasksActionsValue {
  return useRequiredContext(
    TasksActionsContext,
    "useTasksActions",
    "TasksProvider",
  );
}
