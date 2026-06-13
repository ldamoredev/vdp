import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { useCore } from "@/CoreProvider";
import { getTodayISO } from "@/lib/format";
import { TasksEvents } from "@/ui/events/TasksEvents";
import { TasksDashboardStore } from "./TasksDashboardStore";

const TasksDashboardContext = createContext<TasksDashboardStore | null>(null);

/**
 * Owns the shared dashboard store (today's list, filter, selection) and the
 * TasksEvents channel, shared by the dashboard's section presenters. Starts the
 * store on mount (initial load + chat-sync subscription) and stops it on unmount.
 */
export function TasksDashboardProvider({ children }: { children: ReactNode }) {
  const core = useCore();
  const [store] = useState(() => new TasksDashboardStore(core, new TasksEvents(), getTodayISO()));

  useEffect(() => store.start(), [store]);

  return <TasksDashboardContext.Provider value={store}>{children}</TasksDashboardContext.Provider>;
}

export function useTasksDashboardStore(): TasksDashboardStore {
  const store = useContext(TasksDashboardContext);
  if (!store) throw new Error("useTasksDashboardStore must be used within a TasksDashboardProvider");
  return store;
}
