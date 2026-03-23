"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import type { TaskNote } from "@/lib/api/types";
import { getTodayISO } from "@/lib/format";
import {
  analyzeTaskDraft,
  buildClarifiedDescription,
} from "@/lib/tasks/clarify-task";
import { buildBreakdownSuggestions } from "@/lib/tasks/breakdown-task";
import { syncTaskQueryState } from "@/lib/tasks/chat-sync";
import {
  buildPlanningSignals,
  getFilterTasks,
  sortExecutionQueue,
  taskDomainOptions,
  type TaskFilter,
} from "./tasks-dashboard-selectors";

export function useTasksDashboardModel() {
  const queryClient = useQueryClient();
  const today = getTodayISO();
  const breakdownStudioRef = useRef<HTMLDivElement>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState(2);
  const [newDomain, setNewDomain] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("focus");
  const [clarificationOutcome, setClarificationOutcome] = useState("");
  const [clarificationNextStep, setClarificationNextStep] = useState("");
  const [showClarificationGate, setShowClarificationGate] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [newBreakdownStep, setNewBreakdownStep] = useState("");
  const [newTaskNote, setNewTaskNote] = useState("");
  const [newTaskNoteType, setNewTaskNoteType] = useState<TaskNote["type"]>("note");
  const [expandedTaskActions, setExpandedTaskActions] = useState<string | null>(null);

  const { data: tasksResult } = useQuery({
    queryKey: ["tasks", today, "all"],
    queryFn: () => tasksApi.getTasks({ scheduledDate: today }),
  });

  const { data: todayStats } = useQuery({
    queryKey: ["tasks", "stats", "today"],
    queryFn: tasksApi.getTodayStats,
  });

  const { data: review } = useQuery({
    queryKey: ["tasks", "review", today],
    queryFn: () => tasksApi.getReview(today),
  });

  const { data: trend } = useQuery({
    queryKey: ["tasks", "trend", 7],
    queryFn: () => tasksApi.getTrend(7),
  });

  const { data: carryOverRate } = useQuery({
    queryKey: ["tasks", "carry-over-rate", 7],
    queryFn: () => tasksApi.getCarryOverRate(7),
  });

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
      setSelectedTaskId(task.id);
      setFilter("focus");
    },
  });

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
      if (variables.type === "breakdown_step") {
        setNewBreakdownStep("");
      } else {
        setNewTaskNote("");
        setNewTaskNoteType("note");
      }

      await queryClient.invalidateQueries({
        queryKey: ["tasks", "detail", variables.taskId],
      });
    },
  });

  const tasks = sortExecutionQueue(tasksResult?.tasks || []);
  const pendingTasks = tasks.filter((task) => task.status === "pending");
  const doneTasks = tasks.filter((task) => task.status === "done");
  const visibleTasks = getFilterTasks(tasks, filter);
  const urgentTasks = pendingTasks.filter(
    (task) => task.priority === 3 || task.carryOverCount > 0,
  );
  const stuckTasks = pendingTasks.filter((task) => task.carryOverCount >= 3);
  const topTask = visibleTasks[0] || pendingTasks[0];
  const completionAverage = trend?.length
    ? Math.round(
        trend.reduce((acc, day) => acc + day.completionRate, 0) / trend.length,
      )
    : 0;
  const planning = buildPlanningSignals({
    pendingTasks,
    urgentTasks,
    stuckTasks,
    carryOverRate: carryOverRate?.rate,
  });
  const draftClarification = analyzeTaskDraft(newTitle);
  const defaultSelectedTaskId = planning.focusTasks[0]?.id || pendingTasks[0]?.id;
  const activeSelectedTaskId = selectedTaskId || defaultSelectedTaskId;

  const { data: selectedTaskDetails } = useQuery({
    queryKey: ["tasks", "detail", activeSelectedTaskId],
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

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    submitTask(false);
  }

  function openBreakdownStudio(taskId: string) {
    setSelectedTaskId(taskId);
    breakdownStudioRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function isTaskBusy(taskId: string) {
    return (
      (completeMutation.isPending && completeMutation.variables === taskId) ||
      (carryOverMutation.isPending && carryOverMutation.variables === taskId) ||
      (discardMutation.isPending && discardMutation.variables === taskId) ||
      (deleteMutation.isPending && deleteMutation.variables === taskId)
    );
  }

  return {
    today,
    breakdownStudioRef,
    domainOptions: taskDomainOptions,
    tasks,
    pendingTasks,
    doneTasks,
    visibleTasks,
    urgentTasks,
    stuckTasks,
    topTask,
    completionAverage,
    planning,
    draftClarification,
    review,
    trend,
    todayStats,
    carryOverRate,
    selectedTask,
    selectedTaskNotes,
    breakdownSuggestions,
    persistedSteps,
    blockerNotes,
    contextNotes,
    defaultSelectedTaskId,
    activeSelectedTaskId,
    filter,
    setFilter,
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
    selectedTaskId,
    setSelectedTaskId,
    newBreakdownStep,
    setNewBreakdownStep,
    newTaskNote,
    setNewTaskNote,
    newTaskNoteType,
    setNewTaskNoteType,
    expandedTaskActions,
    setExpandedTaskActions,
    isCreatingTask: createMutation.isPending,
    isCarryingOverAll: carryOverAllMutation.isPending,
    isAddingTaskNote: addTaskNoteMutation.isPending,
    handleCreate,
    submitTask,
    openBreakdownStudio,
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
