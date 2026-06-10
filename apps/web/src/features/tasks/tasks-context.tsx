"use client";

import { createContext, type SyntheticEvent, type RefObject } from "react";
import type { Task, TaskNote, TaskReview } from "@/lib/api/types";
import type { TaskFilter, PlanningTone } from "./tasks-dashboard-selectors";
import { useTasksQueries } from "./use-tasks-queries";
import { useTaskMutations } from "./use-task-mutations";
import { useTaskCreation } from "./use-task-creation";
import { useTaskDetail } from "./use-task-detail";

export interface TasksQueriesValue {
  today: string;
  domainOptions: { value: string; label: string }[];
  tasks: Task[];
  pendingTasks: Task[];
  doneTasks: Task[];
  visibleTasks: Task[];
  urgentTasks: Task[];
  stuckTasks: Task[];
  topTask: Task | undefined;
  completionAverage: number;
  planning: {
    tone: PlanningTone;
    headline: string;
    summary: string;
    recommendations: string[];
    focusTasks: Task[];
  };
  review: TaskReview | undefined;
  trend: { date: string; completionRate: number }[] | undefined;
  todayStats: { completionRate: number; completed: number; total: number } | undefined;
  carryOverRate: { rate: number } | undefined;
  filter: TaskFilter;

  breakdownStudioRef: RefObject<HTMLDivElement | null>;
  selectedTask: Task | undefined;
  selectedTaskNotes: TaskNote[];
  breakdownSuggestions: { title: string; steps: string[] }[];
  persistedSteps: TaskNote[];
  blockerNotes: TaskNote[];
  contextNotes: TaskNote[];
  activeSelectedTaskId: string | undefined;
  newBreakdownStep: string;
  newTaskNote: string;
  newTaskNoteType: "note" | "blocker" | "breakdown_step";

  newTitle: string;
  newPriority: number;
  newDomain: string;
  clarificationOutcome: string;
  clarificationNextStep: string;
  showClarificationGate: boolean;
  draftClarification: {
    needsClarification: boolean;
    reasons: string[];
    examples: string[];
  };
  isCreatingTask: boolean;

  // mutation state
  expandedTaskActions: string | null;
  isCarryingOverAll: boolean;
  isAddingTaskNote: boolean;
}

export interface TasksActionsValue {
  readonly setFilter: (filter: TaskFilter) => void;

  readonly openBreakdownStudio: (taskId: string) => void;
  readonly setNewBreakdownStep: (value: string) => void;
  readonly setNewTaskNote: (value: string) => void;
  readonly setNewTaskNoteType: (value: TaskNote["type"]) => void;

  readonly setNewTitle: (value: string) => void;
  readonly setNewPriority: (value: number) => void;
  readonly setNewDomain: (value: string) => void;
  readonly setClarificationOutcome: (value: string) => void;
  readonly setClarificationNextStep: (value: string) => void;
  readonly setShowClarificationGate: (value: boolean) => void;
  readonly handleCreate: (event: SyntheticEvent) => void;
  readonly submitTask: (force?: boolean, includeClarification?: boolean) => void;

  readonly setExpandedTaskActions: (id: string | null) => void;
  readonly carryOverAll: () => void;
  readonly completeTask: (taskId: string) => void;
  readonly carryOverTask: (taskId: string) => void;
  readonly discardTask: (taskId: string) => void;
  readonly deleteTask: (taskId: string) => void;
  readonly addTaskNote: (input: {
    taskId: string;
    content: string;
    type: TaskNote["type"];
  }) => void;
  readonly isTaskBusy: (taskId: string) => boolean;
}

export const TasksQueriesContext = createContext<TasksQueriesValue | null>(null);
export const TasksActionsContext = createContext<TasksActionsValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function TasksProvider({ children }: { children: React.ReactNode }) {
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

  const queriesValue: TasksQueriesValue = {
    // queries
    today: queries.today,
    domainOptions: queries.domainOptions,
    tasks: queries.tasks,
    pendingTasks: queries.pendingTasks,
    doneTasks: queries.doneTasks,
    visibleTasks: queries.visibleTasks,
    urgentTasks: queries.urgentTasks,
    stuckTasks: queries.stuckTasks,
    topTask: queries.topTask,
    completionAverage: queries.completionAverage,
    planning: queries.planning,
    review: queries.review,
    trend: queries.trend,
    todayStats: queries.todayStats,
    carryOverRate: queries.carryOverRate,
    filter: queries.filter,

    // detail
    breakdownStudioRef: detail.breakdownStudioRef,
    selectedTask: detail.selectedTask,
    selectedTaskNotes: detail.selectedTaskNotes,
    breakdownSuggestions: detail.breakdownSuggestions,
    persistedSteps: detail.persistedSteps,
    blockerNotes: detail.blockerNotes,
    contextNotes: detail.contextNotes,
    activeSelectedTaskId: detail.activeSelectedTaskId,
    newBreakdownStep: detail.newBreakdownStep,
    newTaskNote: detail.newTaskNote,
    newTaskNoteType: detail.newTaskNoteType,

    // creation
    newTitle: creation.newTitle,
    newPriority: creation.newPriority,
    newDomain: creation.newDomain,
    clarificationOutcome: creation.clarificationOutcome,
    clarificationNextStep: creation.clarificationNextStep,
    showClarificationGate: creation.showClarificationGate,
    draftClarification: creation.draftClarification,
    isCreatingTask: creation.isCreatingTask,

    // mutation state
    expandedTaskActions: mutations.expandedTaskActions,
    isCarryingOverAll: mutations.isCarryingOverAll,
    isAddingTaskNote: mutations.isAddingTaskNote,
  };

  // Actions context value is intentionally NOT memoized.
  // The provider re-renders on every query data change, so all children already
  // re-render via QueriesContext. Memoizing actions with [] would freeze stale
  // closures (submitTask, handleCreate, isTaskBusy read per-render state).
  // The split context still serves as a clean API boundary (data vs actions).
  const actionsValue: TasksActionsValue = {
    // query actions
    setFilter: queries.setFilter,

    // detail actions
    openBreakdownStudio: detail.openBreakdownStudio,
    setNewBreakdownStep: detail.setNewBreakdownStep,
    setNewTaskNote: detail.setNewTaskNote,
    setNewTaskNoteType: detail.setNewTaskNoteType,

    // creation actions
    setNewTitle: creation.setNewTitle,
    setNewPriority: creation.setNewPriority,
    setNewDomain: creation.setNewDomain,
    setClarificationOutcome: creation.setClarificationOutcome,
    setClarificationNextStep: creation.setClarificationNextStep,
    setShowClarificationGate: creation.setShowClarificationGate,
    handleCreate: creation.handleCreate,
    submitTask: creation.submitTask,

    // mutation actions
    setExpandedTaskActions: mutations.setExpandedTaskActions,
    carryOverAll: mutations.carryOverAll,
    completeTask: mutations.completeTask,
    carryOverTask: mutations.carryOverTask,
    discardTask: mutations.discardTask,
    deleteTask: mutations.deleteTask,
    addTaskNote: mutations.addTaskNote,
    isTaskBusy: mutations.isTaskBusy,
  };

  return (
    <TasksActionsContext value={actionsValue}>
      <TasksQueriesContext value={queriesValue}>
        {children}
      </TasksQueriesContext>
    </TasksActionsContext>
  );
}
