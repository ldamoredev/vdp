import { eventBus } from "../../core/event-bus/index.js";

/**
 * Tasks domain events.
 *
 * Emitted when significant task patterns are detected.
 * Other domains can subscribe to react (e.g., Work suggests promoting stuck tasks).
 */
export const tasksEvents = {
  dailyAllCompleted: (data: {
    date: string;
    count: number;
  }) => eventBus.emit("tasks", "daily.all_completed", data),

  taskStuck: (data: {
    taskId: string;
    title: string;
    carryOverCount: number;
  }) => eventBus.emit("tasks", "task.stuck", data),

  dailyEmpty: (data: {
    date: string;
  }) => eventBus.emit("tasks", "daily.empty", data),

  overloaded: (data: {
    carryOverRate: number;
    period: string;
  }) => eventBus.emit("tasks", "overloaded", data),
};
