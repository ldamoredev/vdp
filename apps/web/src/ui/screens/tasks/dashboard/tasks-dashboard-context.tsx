import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { useCore } from "@/CoreProvider";
import { useTasksEvents } from "@/TasksEventsProvider";
import { getTodayISO } from "@/lib/format";
import { TasksDashboardStore } from "./TasksDashboardStore";

const TASKS_DASHBOARD_CONTEXT_KEY = "__vdpTasksDashboardContext";

const globalContextRegistry = globalThis as typeof globalThis & {
  [TASKS_DASHBOARD_CONTEXT_KEY]?: ReturnType<typeof createContext<TasksDashboardStore | null>>;
};

const TasksDashboardContext =
  globalContextRegistry[TASKS_DASHBOARD_CONTEXT_KEY] ??
  createContext<TasksDashboardStore | null>(null);

globalContextRegistry[TASKS_DASHBOARD_CONTEXT_KEY] = TasksDashboardContext;

/**
 * Owns the shared dashboard store (today's list, filter, selection) and the
 * app-wide TasksEvents channel, shared by the dashboard's section presenters. Starts the
 * store on mount (initial load + chat-sync subscription) and stops it on unmount.
 */
export function TasksDashboardProvider({ children }: { children: ReactNode }) {
  const core = useCore();
  const events = useTasksEvents();
  const [store] = useState(() => new TasksDashboardStore(core, events, getTodayISO()));

  useEffect(() => store.start(), [store]);

  return <TasksDashboardContext.Provider value={store}>{children}</TasksDashboardContext.Provider>;
}

export function useTasksDashboardStore(): TasksDashboardStore {
  const store = useContext(TasksDashboardContext);
  if (!store) throw new Error("useTasksDashboardStore must be used within a TasksDashboardProvider");
  return store;
}
