"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import type { Task } from "@/lib/api/types";
import { buildBreakdownSuggestions } from "@/lib/tasks/breakdown-task";
import { tasksQueryKeys } from "./tasks-query-keys";

export function useTaskDetail(args: {
  tasks: Task[];
  pendingTasks: Task[];
  focusTasks: Task[];
}) {
  const { tasks, pendingTasks, focusTasks } = args;
  const breakdownStudioRef = useRef<HTMLDivElement>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [newBreakdownStep, setNewBreakdownStep] = useState("");
  const [newTaskNote, setNewTaskNote] = useState("");
  const [newTaskNoteType, setNewTaskNoteType] = useState<"note" | "blocker" | "breakdown_step">("note");

  const defaultSelectedTaskId = focusTasks[0]?.id || pendingTasks[0]?.id;
  const activeSelectedTaskId = selectedTaskId || defaultSelectedTaskId;

  const { data: selectedTaskDetails } = useQuery({
    queryKey: tasksQueryKeys.detail(activeSelectedTaskId),
    queryFn: () => tasksApi.getTask(activeSelectedTaskId!),
    enabled: !!activeSelectedTaskId,
  });

  const selectedTask =
    selectedTaskDetails?.task ||
    tasks.find((task) => task.id === activeSelectedTaskId);
  const selectedTaskNotes = selectedTaskDetails?.notes || [];
  const breakdownSuggestions = selectedTask
    ? buildBreakdownSuggestions(selectedTask)
    : [];
  const persistedSteps = selectedTaskNotes.filter(
    (note) => note.type === "breakdown_step",
  );
  const blockerNotes = selectedTaskNotes.filter((note) => note.type === "blocker");
  const contextNotes = selectedTaskNotes.filter((note) => note.type === "note");

  useEffect(() => {
    if (!selectedTaskId && defaultSelectedTaskId) {
      setSelectedTaskId(defaultSelectedTaskId);
      return;
    }

    if (selectedTaskId && !tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(defaultSelectedTaskId);
    }
  }, [defaultSelectedTaskId, selectedTaskId, tasks]);

  function openBreakdownStudio(taskId: string) {
    setSelectedTaskId(taskId);
    breakdownStudioRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function clearBreakdownStep() {
    setNewBreakdownStep("");
  }

  function clearTaskNote() {
    setNewTaskNote("");
    setNewTaskNoteType("note");
  }

  return {
    breakdownStudioRef,
    selectedTask,
    selectedTaskNotes,
    breakdownSuggestions,
    persistedSteps,
    blockerNotes,
    contextNotes,
    defaultSelectedTaskId,
    activeSelectedTaskId,
    selectedTaskId,
    setSelectedTaskId,
    newBreakdownStep,
    setNewBreakdownStep,
    newTaskNote,
    setNewTaskNote,
    newTaskNoteType,
    setNewTaskNoteType,
    openBreakdownStudio,
    clearBreakdownStep,
    clearTaskNote,
  };
}
