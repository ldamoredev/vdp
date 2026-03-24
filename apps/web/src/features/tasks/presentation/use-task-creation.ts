"use client";

import { type SyntheticEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { syncTaskQueryState } from "@/lib/tasks/chat-sync";
import {
  analyzeTaskDraft,
  buildClarifiedDescription,
} from "@/lib/tasks/clarify-task";
import type { TaskFilter } from "./tasks-dashboard-selectors";

export function useTaskCreation(callbacks: {
  onCreated: (taskId: string) => void;
  setFilter: (filter: TaskFilter) => void;
}) {
  const queryClient = useQueryClient();

  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState(2);
  const [newDomain, setNewDomain] = useState("");
  const [clarificationOutcome, setClarificationOutcome] = useState("");
  const [clarificationNextStep, setClarificationNextStep] = useState("");
  const [showClarificationGate, setShowClarificationGate] = useState(false);

  const createMutation = useMutation({
    mutationFn: tasksApi.createTask,
    onSuccess: (task) => {
      syncTaskQueryState({
        tool: "create_task",
        parsedResult: task,
        queryClient,
      });
      setNewTitle("");
      setNewPriority(2);
      setNewDomain("");
      setClarificationOutcome("");
      setClarificationNextStep("");
      setShowClarificationGate(false);
      callbacks.onCreated(task.id);
      callbacks.setFilter("focus");
    },
  });

  const draftClarification = analyzeTaskDraft(newTitle);

  function submitTask(force = false, includeClarification = true) {
    const title = newTitle.trim();
    if (!title) return;

    const clarification = analyzeTaskDraft(title);
    if (clarification.needsClarification && !force) {
      setShowClarificationGate(true);
      return;
    }

    createMutation.mutate({
      title,
      description: includeClarification
        ? buildClarifiedDescription(
            clarificationOutcome,
            clarificationNextStep,
          )
        : undefined,
      priority: newPriority,
      domain: newDomain || undefined,
    });
  }

  function handleCreate(event: SyntheticEvent) {
    event.preventDefault();
    submitTask(false);
  }

  return {
    newTitle,
    setNewTitle,
    newPriority,
    setNewPriority,
    newDomain,
    setNewDomain,
    clarificationOutcome,
    setClarificationOutcome,
    clarificationNextStep,
    setClarificationNextStep,
    showClarificationGate,
    setShowClarificationGate,
    draftClarification,
    isCreatingTask: createMutation.isPending,
    handleCreate,
    submitTask,
  };
}
