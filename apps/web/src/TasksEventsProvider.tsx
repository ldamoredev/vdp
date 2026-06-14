import { createContext, useContext, useState, type ReactNode } from "react";

import { TasksEvents } from "@/ui/events/TasksEvents";

const TasksEventsContext = createContext<TasksEvents | null>(null);

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
