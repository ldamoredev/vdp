import type { Query, QueryClient, QueryKey } from "@tanstack/react-query";
import { getTodayISO } from "@/lib/format";
import type { Task, TaskListResponse } from "@/lib/api/types";
import {
  homeTaskQueryKeys,
  tasksQueryKeys,
} from "@/features/tasks/presentation/tasks-query-keys";

type TaskMutationTool =
  | "create_task"
  | "update_task"
  | "delete_task"
  | "complete_task"
  | "carry_over_task"
  | "discard_task"
  | "carry_over_all_pending";

type TaskSyncInput = {
  tool: string;
  result?: string | null;
  parsedResult?: unknown;
  input?: Record<string, unknown>;
  queryClient: QueryClient;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isTask(value: unknown): value is Task {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.status === "string" &&
    typeof value.scheduledDate === "string"
  );
}

function parseResult(result?: string | null): unknown {
  if (!result) return null;

  try {
    return JSON.parse(result);
  } catch {
    return null;
  }
}

function isTaskMutationTool(tool: string): tool is TaskMutationTool {
  return [
    "create_task",
    "update_task",
    "delete_task",
    "complete_task",
    "carry_over_task",
    "discard_task",
    "carry_over_all_pending",
  ].includes(tool);
}

function extractTasks(tool: TaskMutationTool, parsed: unknown) {
  if (
    (tool === "create_task" ||
      tool === "update_task" ||
      tool === "complete_task" ||
      tool === "carry_over_task" ||
      tool === "discard_task") &&
    isTask(parsed)
  ) {
    return [parsed];
  }

  if (
    tool === "carry_over_all_pending" &&
    isRecord(parsed) &&
    Array.isArray(parsed.tasks)
  ) {
    return parsed.tasks.filter(isTask);
  }

  return [];
}

function extractDeletedTaskId(
  tool: TaskMutationTool,
  input?: Record<string, unknown>,
) {
  if (tool !== "delete_task") return undefined;
  return typeof input?.taskId === "string" ? input.taskId : undefined;
}

function isTaskListResponse(value: unknown): value is TaskListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.tasks) &&
    typeof value.total === "number" &&
    typeof value.limit === "number" &&
    typeof value.offset === "number"
  );
}

function matchesFilter(task: Task, filter: string) {
  return filter === "all" || task.status === filter;
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
}

function upsertTaskIntoList(
  current: TaskListResponse,
  task: Task,
  options: { scheduledDate: string; filter: string },
) {
  const existingIndex = current.tasks.findIndex((item) => item.id === task.id);
  const shouldInclude =
    task.scheduledDate === options.scheduledDate &&
    matchesFilter(task, options.filter);

  if (existingIndex >= 0 && !shouldInclude) {
    const nextTasks = current.tasks.filter((item) => item.id !== task.id);
    return {
      ...current,
      tasks: nextTasks,
      total: Math.max(0, current.total - 1),
    };
  }

  if (!shouldInclude) return current;

  if (existingIndex >= 0) {
    const nextTasks = [...current.tasks];
    nextTasks[existingIndex] = task;
    return {
      ...current,
      tasks: sortTasks(nextTasks),
    };
  }

  const nextTasks = sortTasks([task, ...current.tasks]).slice(0, current.limit);
  return {
    ...current,
    tasks: nextTasks,
    total: current.total + 1,
  };
}

function removeTaskFromList(current: TaskListResponse, taskId: string) {
  const exists = current.tasks.some((task) => task.id === taskId);
  if (!exists) return current;

  return {
    ...current,
    tasks: current.tasks.filter((task) => task.id !== taskId),
    total: Math.max(0, current.total - 1),
  };
}

function isTasksListKey(
  queryKey: QueryKey,
): queryKey is readonly ["tasks", "list", string, string] {
  return (
    Array.isArray(queryKey) &&
    queryKey[0] === "tasks" &&
    queryKey[1] === "list" &&
    typeof queryKey[2] === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(queryKey[2]) &&
    typeof queryKey[3] === "string"
  );
}

function isHomeTodayListKey(
  queryKey: QueryKey,
): queryKey is readonly ["home", "tasks", "list", string] {
  return (
    Array.isArray(queryKey) &&
    queryKey[0] === "home" &&
    queryKey[1] === "tasks" &&
    queryKey[2] === "list" &&
    typeof queryKey[3] === "string"
  );
}

function updateListQuery(
  queryClient: QueryClient,
  query: Query,
  mutate: (current: TaskListResponse) => TaskListResponse,
) {
  queryClient.setQueryData(query.queryKey, (current: unknown) => {
    if (!isTaskListResponse(current)) return current;
    return mutate(current);
  });
}

function syncTaskListCaches(queryClient: QueryClient, task: Task) {
  const today = getTodayISO();
  const queries = queryClient.getQueryCache().findAll();

  for (const query of queries) {
    const { queryKey } = query;

    if (isTasksListKey(queryKey)) {
      const [, , scheduledDate, filter] = queryKey;
      updateListQuery(queryClient, query, (current) =>
        upsertTaskIntoList(current, task, { scheduledDate, filter }),
      );
      continue;
    }

    if (isHomeTodayListKey(queryKey)) {
      updateListQuery(queryClient, query, (current) =>
        upsertTaskIntoList(current, task, { scheduledDate: today, filter: "all" }),
      );
    }
  }
}

function removeTaskFromCaches(queryClient: QueryClient, taskId: string) {
  const queries = queryClient.getQueryCache().findAll();

  for (const query of queries) {
    if (!Array.isArray(query.queryKey)) continue;

    if (
      (query.queryKey[0] === "tasks" || query.queryKey[0] === "home") &&
      query.state.data
    ) {
      updateListQuery(queryClient, query, (current) => removeTaskFromList(current, taskId));
    }
  }
}

function invalidateTaskDerivedData(queryClient: QueryClient) {
  void queryClient.invalidateQueries({
    queryKey: tasksQueryKeys.key("stats"),
  });
  void queryClient.invalidateQueries({
    queryKey: tasksQueryKeys.key("review"),
  });
  void queryClient.invalidateQueries({
    queryKey: tasksQueryKeys.key("stats", "trend"),
  });
  void queryClient.invalidateQueries({
    queryKey: tasksQueryKeys.byDomain,
  });
  void queryClient.invalidateQueries({
    queryKey: tasksQueryKeys.key("stats", "carry-over-rate"),
  });
  void queryClient.invalidateQueries({
    queryKey: homeTaskQueryKeys.taskStats,
  });
  void queryClient.invalidateQueries({
    queryKey: homeTaskQueryKeys.review(getTodayISO()).slice(0, 3),
  });
  void queryClient.invalidateQueries({
    queryKey: homeTaskQueryKeys.trend(7).slice(0, 3),
  });
}

export function syncTaskQueryState({
  tool,
  result,
  parsedResult,
  input,
  queryClient,
}: TaskSyncInput) {
  if (!isTaskMutationTool(tool)) return;

  const parsed = parsedResult ?? parseResult(result);
  const deletedTaskId = extractDeletedTaskId(tool, input);

  if (deletedTaskId) {
    removeTaskFromCaches(queryClient, deletedTaskId);
    invalidateTaskDerivedData(queryClient);
    return;
  }

  const tasks = extractTasks(tool, parsed);
  if (tasks.length === 0) return;

  for (const task of tasks) {
    syncTaskListCaches(queryClient, task);
  }

  invalidateTaskDerivedData(queryClient);
}
