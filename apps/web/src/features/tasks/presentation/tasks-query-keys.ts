import { createDomainQueryKeys } from "@/lib/query-keys";

const tasksKeys = createDomainQueryKeys("tasks");
const homeKeys = createDomainQueryKeys("home");

export const tasksQueryKeys = {
  all: tasksKeys.all,
  key: tasksKeys.key,
  list: (scheduledDate: string, filter = "all") =>
    tasksKeys.key("list", scheduledDate, filter),
  detail: (taskId: string | undefined) => tasksKeys.key("detail", taskId),
  review: (date: string) => tasksKeys.key("review", date),
  trend: (days: number) => tasksKeys.key("stats", "trend", days),
  todayStats: tasksKeys.key("stats", "today"),
  byDomain: tasksKeys.key("stats", "by-domain"),
  carryOverRate: (days: number) =>
    tasksKeys.key("stats", "carry-over-rate", days),
} as const;

export const homeTaskQueryKeys = {
  taskStats: homeKeys.key("tasks", "stats", "today"),
  tasksToday: (date: string) => homeKeys.key("tasks", "list", date),
  review: (date: string) => homeKeys.key("tasks", "review", date),
  trend: (days: number) => homeKeys.key("tasks", "trend", days),
} as const;
