import type { TaskFilter } from "@/core/domain/tasks/Task";

export interface ExecutionQueueViewModel {
  filter: TaskFilter;
  filterOptions: FilterOptionVM[];
  rows: TaskRowVM[];
  isLoading: boolean;
  error: boolean;
}

export interface FilterOptionVM {
  key: TaskFilter;
  label: string;
  count: number;
}

export interface TaskRowVM {
  id: string;
  title: string;
  done: boolean;
  isStuck: boolean;
  toneClass: string;
  priority: number;
  domain: string | null;
  carryOverCount: number;
  busy: boolean;
  actionsOpen: boolean;
}
