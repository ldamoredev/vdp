"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import type { TaskNote } from "@/lib/api/types";
import { getTodayISO } from "@/lib/format";
import { syncTaskQueryState } from "@/lib/tasks/chat-sync";
import { tasksQueryKeys } from "./tasks-query-keys";

export function useTaskMutations(callbacks?: {
  onNoteAdded?: (type: TaskNote["type"]) => void;
}) {
  const queryClient = useQueryClient();
  const today = getTodayISO();
  const [expandedTaskActions, setExpandedTaskActions] = useState<string | null>(null);

  const completeMutation = useMutation({
    mutationFn: tasksApi.completeTask,
    onSuccess: (task) =>
      syncTaskQueryState({
        tool: "complete_task",
        parsedResult: task,
        queryClient,
      }),
  });

  const carryOverMutation = useMutation({
    mutationFn: (id: string) => tasksApi.carryOverTask(id),
    onSuccess: (task) =>
      syncTaskQueryState({
        tool: "carry_over_task",
        parsedResult: task,
        queryClient,
      }),
  });

  const discardMutation = useMutation({
    mutationFn: tasksApi.discardTask,
    onSuccess: (task) =>
      syncTaskQueryState({
        tool: "discard_task",
        parsedResult: task,
        queryClient,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.deleteTask,
    onSuccess: (_result, taskId) =>
      syncTaskQueryState({
        tool: "delete_task",
        input: { taskId },
        queryClient,
      }),
  });

  const carryOverAllMutation = useMutation({
    mutationFn: () => tasksApi.carryOverAll(today),
    onSuccess: (result) =>
      syncTaskQueryState({
        tool: "carry_over_all_pending",
        parsedResult: result,
        input: { fromDate: today },
        queryClient,
      }),
  });

  const addTaskNoteMutation = useMutation({
    mutationFn: ({
      taskId,
      content,
      type,
    }: {
      taskId: string;
      content: string;
      type: TaskNote["type"];
    }) => tasksApi.addNote(taskId, content, type),
    onSuccess: async (_note, variables) => {
      callbacks?.onNoteAdded?.(variables.type);
      await queryClient.invalidateQueries({
        queryKey: tasksQueryKeys.detail(variables.taskId),
      });
    },
  });

  function isTaskBusy(taskId: string) {
    return (
      (completeMutation.isPending && completeMutation.variables === taskId) ||
      (carryOverMutation.isPending && carryOverMutation.variables === taskId) ||
      (discardMutation.isPending && discardMutation.variables === taskId) ||
      (deleteMutation.isPending && deleteMutation.variables === taskId)
    );
  }

  return {
    expandedTaskActions,
    setExpandedTaskActions,
    isCarryingOverAll: carryOverAllMutation.isPending,
    isAddingTaskNote: addTaskNoteMutation.isPending,
    carryOverAll: () => carryOverAllMutation.mutate(),
    completeTask: (taskId: string) => completeMutation.mutate(taskId),
    carryOverTask: (taskId: string) => carryOverMutation.mutate(taskId),
    discardTask: (taskId: string) => discardMutation.mutate(taskId),
    deleteTask: (taskId: string) => deleteMutation.mutate(taskId),
    addTaskNote: (input: { taskId: string; content: string; type: TaskNote["type"] }) =>
      addTaskNoteMutation.mutate(input),
    isTaskBusy,
  };
}
