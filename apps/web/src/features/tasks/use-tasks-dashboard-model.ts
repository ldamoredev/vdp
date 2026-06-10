"use client";

import { useTasksQueries } from "./use-tasks-queries";
import { useTaskMutations } from "./use-task-mutations";
import { useTaskCreation } from "./use-task-creation";
import { useTaskDetail } from "./use-task-detail";

export function useTasksDashboardModel() {
  const queries = useTasksQueries();

  const detail = useTaskDetail({
    tasks: queries.tasks,
    pendingTasks: queries.pendingTasks,
    focusTasks: queries.planning.focusTasks,
  });

  const mutations = useTaskMutations({
    onNoteAdded: (type) => {
      if (type === "breakdown_step") {
        detail.clearBreakdownStep();
      } else {
        detail.clearTaskNote();
      }
    },
  });

  const creation = useTaskCreation({
    onCreated: (taskId) => detail.setSelectedTaskId(taskId),
    setFilter: queries.setFilter,
  });

  return {
    ...queries,
    ...mutations,
    ...detail,
    ...creation,
  };
}
