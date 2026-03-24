"use client";

import { useContext } from "react";
import {
  TasksQueriesContext,
  TasksActionsContext,
  type TasksQueriesValue,
  type TasksActionsValue,
} from "./tasks-context";

/**
 * Access read-only task data (tasks, stats, planning, detail, creation state).
 * Must be used within a <TasksProvider>.
 */
export function useTasksData(): TasksQueriesValue {
  const ctx = useContext(TasksQueriesContext);
  if (!ctx) {
    throw new Error("useTasksData must be used within a <TasksProvider>");
  }
  return ctx;
}

/**
 * Access stable task action functions (mutations, setters, form handlers).
 * Must be used within a <TasksProvider>.
 * References are stable across renders — safe to use in dependency arrays.
 */
export function useTasksActions(): TasksActionsValue {
  const ctx = useContext(TasksActionsContext);
  if (!ctx) {
    throw new Error("useTasksActions must be used within a <TasksProvider>");
  }
  return ctx;
}
