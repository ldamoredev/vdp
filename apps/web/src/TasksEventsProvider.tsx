import { createContext, useContext, useState, type ReactNode } from "react";

import { TasksEvents } from "@/ui/events/TasksEvents";

const TASKS_EVENTS_CONTEXT_KEY = "__vdpTasksEventsContext";

const globalContextRegistry = globalThis as typeof globalThis & {
  [TASKS_EVENTS_CONTEXT_KEY]?: ReturnType<typeof createContext<TasksEvents | null>>;
};

const TasksEventsContext =
  globalContextRegistry[TASKS_EVENTS_CONTEXT_KEY] ?? createContext<TasksEvents | null>(null);

globalContextRegistry[TASKS_EVENTS_CONTEXT_KEY] = TasksEventsContext;

/** Owns one app-wide TasksEvents instance shared by tasks screens and the chat shell. */
export function TasksEventsProvider({ children }: { children: ReactNode }) {
  const [events] = useState(() => new TasksEvents());
  return <TasksEventsContext.Provider value={events}>{children}</TasksEventsContext.Provider>;
}

export function useTasksEvents(): TasksEvents {
  const events = useContext(TasksEventsContext);
  if (!events) throw new Error("useTasksEvents must be used within a TasksEventsProvider");
  return events;
}
