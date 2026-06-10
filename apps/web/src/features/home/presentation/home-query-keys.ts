import { createDomainQueryKeys } from "@/lib/query-keys";

const homeKeys = createDomainQueryKeys("home");

// Task data cached under the home dashboard's own namespace. The tasks
// feature's chat-sync writes into these keys, so their shape is part of the
// cross-feature contract.
export const homeTaskQueryKeys = {
  taskStats: homeKeys.key("tasks", "stats", "today"),
  tasksToday: (date: string) => homeKeys.key("tasks", "list", date),
  review: (date: string) => homeKeys.key("tasks", "review", date),
  trend: (days: number) => homeKeys.key("tasks", "trend", days),
} as const;
