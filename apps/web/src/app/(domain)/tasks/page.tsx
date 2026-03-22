"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  Compass,
  Check,
  CheckCheck,
  Clock3,
  Flame,
  History,
  ListTodo,
  MoreHorizontal,
  Plus,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { tasksApi } from "@/lib/api/tasks";
import type { Task, TaskNote } from "@/lib/api/types";
import {
  domainLabel,
  getTodayISO,
  priorityLabel,
} from "@/lib/format";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskDomainBadge } from "@/components/tasks/task-domain-badge";
import {
  analyzeTaskDraft,
  buildClarifiedDescription,
} from "@/lib/tasks/clarify-task";
import {
  buildBreakdownSuggestions,
  normalizeBreakdownStep,
} from "@/lib/tasks/breakdown-task";
import { syncTaskQueryState } from "@/lib/tasks/chat-sync";

const today = getTodayISO();

type TaskFilter = "focus" | "pending" | "done" | "all";
type PlanningTone = "success" | "info" | "warning" | "error";

const domainOptions = [
  { value: "", label: "Sin dominio" },
  { value: "wallet", label: "Finanzas" },
  { value: "health", label: "Salud" },
  { value: "work", label: "Trabajo" },
  { value: "people", label: "Gente" },
  { value: "study", label: "Estudio" },
];

function sortExecutionQueue(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "pending" ? -1 : 1;
    }

    if (left.carryOverCount !== right.carryOverCount) {
      return right.carryOverCount - left.carryOverCount;
    }

    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
}

function getFilterTasks(tasks: Task[], filter: TaskFilter) {
  if (filter === "pending") return tasks.filter((task) => task.status === "pending");
  if (filter === "done") return tasks.filter((task) => task.status === "done");
  if (filter === "focus") {
    return tasks.filter(
      (task) =>
        task.status === "pending" &&
        (task.priority >= 2 || task.carryOverCount > 0),
    );
  }

  return tasks;
}

function getTaskTone(task: Task) {
  if (task.status === "done") {
    return "border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)]";
  }

  if (task.carryOverCount >= 3) {
    return "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)]";
  }

  if (task.carryOverCount > 0 || task.priority === 3) {
    return "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)]";
  }

  return "border-[var(--glass-border)] bg-[var(--hover-overlay)]";
}

function getPlanningToneClasses(tone: PlanningTone) {
  if (tone === "success") {
    return "border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)]";
  }

  if (tone === "warning") {
    return "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)]";
  }

  if (tone === "error") {
    return "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)]";
  }

  return "border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)]";
}

function formatTaskDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function noteTypeLabel(type: TaskNote["type"]) {
  if (type === "breakdown_step") return "Paso";
  if (type === "blocker") return "Bloqueo";
  return "Nota";
}

function noteTypeTone(type: TaskNote["type"]) {
  if (type === "breakdown_step") {
    return "border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] text-[var(--violet-soft-text)]";
  }

  if (type === "blocker") {
    return "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] text-[var(--red-soft-text)]";
  }

  return "border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--foreground)]";
}

function buildPlanningSignals(args: {
  pendingTasks: Task[];
  urgentTasks: Task[];
  stuckTasks: Task[];
  carryOverRate?: number;
}) {
  const { pendingTasks, urgentTasks, stuckTasks, carryOverRate = 0 } = args;
  const focusTasks = pendingTasks
    .filter((task) => task.priority >= 2 || task.carryOverCount > 0)
    .slice(0, 3);

  const tone: PlanningTone =
    stuckTasks.length > 0 || carryOverRate >= 50 || pendingTasks.length >= 8
      ? "error"
      : urgentTasks.length >= 4 || carryOverRate >= 35 || pendingTasks.length >= 5
        ? "warning"
        : pendingTasks.length === 0
          ? "success"
          : "info";

  const headline =
    tone === "error"
      ? "Plan cargado al limite"
      : tone === "warning"
        ? "Plan con presion"
        : tone === "success"
          ? "Plan liviano"
          : "Plan controlable";

  const summary =
    tone === "error"
      ? "Conviene bajar la carga antes de seguir agregando tareas. El arrastre ya esta afectando la ejecucion."
      : tone === "warning"
        ? "Todavia es recuperable, pero necesitas elegir mejor que entra en foco y que no."
        : tone === "success"
          ? "La carga de hoy es baja. Puedes ejecutar sin entrar en modo reactivo."
          : "Hay trabajo real, pero la cola aun puede sostenerse si respetas el foco.";

  const recommendations = [
    pendingTasks.length === 0
      ? "No agregues volumen artificial. Usa el chat o captura rapida solo si aparece trabajo concreto."
      : `Limita el foco a ${Math.max(1, Math.min(3, focusTasks.length || 3))} tarea${focusTasks.length === 1 ? "" : "s"} de impacto inmediato.`,
    carryOverRate >= 35
      ? `El carry-over de 7 dias va en ${carryOverRate}%. Prioriza cierre o descarte antes de seguir moviendo tareas.`
      : "El arrastre semanal esta bajo control. Mantener el foco hoy vale mas que replanificar de mas.",
    stuckTasks.length > 0
      ? `${stuckTasks.length} tarea${stuckTasks.length === 1 ? "" : "s"} ya estan bloqueadas por carry-over. Necesitan decision explicita, no mas espera.`
      : urgentTasks.length > 0
        ? `${urgentTasks.length} tarea${urgentTasks.length === 1 ? "" : "s"} caliente${urgentTasks.length === 1 ? "" : "s"} merecen resolucion antes del resto.`
        : "No hay señales fuertes de atasco. Puedes sostener el plan si evitas abrir demasiados frentes.",
  ];

  return {
    tone,
    headline,
    summary,
    recommendations,
    focusTasks,
  };
}

export default function TasksDashboard() {
  const queryClient = useQueryClient();
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
  const breakdownStudioRef = useRef<HTMLDivElement>(null);

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

  const isTaskBusy = (taskId: string) =>
    (completeMutation.isPending && completeMutation.variables === taskId) ||
    (carryOverMutation.isPending && carryOverMutation.variables === taskId) ||
    (discardMutation.isPending && discardMutation.variables === taskId) ||
    (deleteMutation.isPending && deleteMutation.variables === taskId);

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

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    submitTask(false);
  }

  function openBreakdownStudio(taskId: string) {
    setSelectedTaskId(taskId);
    breakdownStudioRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  useEffect(() => {
    if (!selectedTaskId && defaultSelectedTaskId) {
      setSelectedTaskId(defaultSelectedTaskId);
      return;
    }

    if (selectedTaskId && !tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(defaultSelectedTaskId);
    }
  }, [defaultSelectedTaskId, selectedTaskId, tasks]);

  return (
    <div className="max-w-6xl space-y-8 animate-fade-in">
      <section className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
        <div className="glass-card-static overflow-hidden">
          <div className="border-b border-[var(--glass-border)] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                  <Sparkles size={12} />
                  Centro operativo
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                  Ejecuta hoy sin perder el hilo
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
                  Este tablero esta sincronizado con el chat. Las acciones del
                  asistente y las manuales impactan la misma cola de trabajo en
                  tiempo real.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => carryOverAllMutation.mutate()}
                  disabled={pendingTasks.length === 0 || carryOverAllMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-4 py-2 text-sm font-medium text-[var(--amber-soft-text)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CalendarClock size={15} />
                  Reprogramar pendientes
                </button>
                <Link
                  href="/tasks/history"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-all hover:translate-y-[-1px]"
                >
                  <History size={15} />
                  Historial
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3">
            <div className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Cumplimiento
                </span>
                <Target size={16} style={{ color: "var(--violet-soft-text)" }} />
              </div>
              <div className="mt-3 flex items-end gap-2">
                <div className="text-3xl font-semibold text-[var(--foreground)]">
                  {todayStats?.completionRate ?? 0}%
                </div>
                <div className="pb-1 text-xs text-[var(--muted)]">
                  {todayStats?.completed ?? 0}/{todayStats?.total ?? 0} hechas
                </div>
              </div>
              <div className="progress-bar mt-4">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${todayStats?.completionRate ?? 0}%`,
                    background:
                      "linear-gradient(90deg, var(--accent-secondary), var(--accent))",
                  }}
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Presion
                </span>
                <Flame size={16} style={{ color: "var(--amber-soft-text)" }} />
              </div>
              <div className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {urgentTasks.length}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                {urgentTasks.length === 0
                  ? "No hay tareas calientes en este momento."
                  : `${stuckTasks.length} bloqueada${stuckTasks.length === 1 ? "" : "s"} por carry-over y ${pendingTasks.filter((task) => task.priority === 3).length} de prioridad alta.`}
              </p>
            </div>

            <div className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Ritmo 7d
                </span>
                <BarChart3 size={16} style={{ color: "var(--violet-soft-text)" }} />
              </div>
              <div className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                {completionAverage}%
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                Promedio semanal. Hoy hay {pendingTasks.length} pendiente
                {pendingTasks.length === 1 ? "" : "s"} y {doneTasks.length} ya
                cerrada{doneTasks.length === 1 ? "" : "s"}.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreate} className="glass-card-static p-6">
          <div className="flex items-center gap-2 text-[var(--foreground)]">
            <Plus size={16} style={{ color: "var(--violet-soft-text)" }} />
            <h3 className="text-sm font-medium">Captura rapida</h3>
          </div>

          <div className="mt-4">
            <textarea
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Agregar una tarea concreta para hoy..."
              rows={4}
              className="glass-input min-h-28 w-full resize-none px-4 py-3 text-sm leading-relaxed"
            />
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                Prioridad operativa
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setNewPriority(priority)}
                    className={`rounded-2xl border px-3 py-2 text-xs font-medium transition-all ${
                      newPriority === priority
                        ? "translate-y-[-1px]"
                        : "border-transparent bg-[var(--hover-overlay)] text-[var(--muted)]"
                    }`}
                    style={
                      newPriority === priority
                        ? {
                            background:
                              priority === 3
                                ? "var(--red-soft-bg)"
                                : priority === 2
                                  ? "var(--amber-soft-bg)"
                                  : "var(--muted-bg)",
                            color:
                              priority === 3
                                ? "var(--red-soft-text)"
                                : priority === 2
                                  ? "var(--amber-soft-text)"
                                  : "var(--foreground)",
                            borderColor:
                              priority === 3
                                ? "var(--red-soft-border)"
                                : priority === 2
                                  ? "var(--amber-soft-border)"
                                  : "var(--divider)",
                          }
                        : undefined
                    }
                  >
                    {priorityLabel(priority)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                Dominio
              </div>
              <select
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="glass-input w-full px-3 py-2 text-sm"
              >
                {domainOptions.map((option) => (
                  <option key={option.value || "none"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!newTitle.trim() || createMutation.isPending}
            className="btn-primary mt-5 w-full justify-center"
          >
            <Plus size={16} />
            {createMutation.isPending ? "Agregando..." : "Agregar a hoy"}
          </button>

          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
            La tarea entra directo en la cola de ejecucion y el chat la ve al
            instante.
          </p>

        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className={`rounded-[30px] border p-6 ${getPlanningToneClasses(planning.tone)}`}>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              <Compass size={12} />
              Plan del dia
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
              {planning.headline}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
              {planning.summary}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-[22px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3 text-center">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                Pendientes
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                {pendingTasks.length}
              </div>
            </div>
            <div className="rounded-[22px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3 text-center">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                Calientes
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                {urgentTasks.length}
              </div>
            </div>
            <div className="rounded-[22px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3 text-center">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                Carry semanal 7d
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                {carryOverRate?.rate ?? 0}%
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {planning.recommendations.map((recommendation) => (
              <div
                key={recommendation}
                className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4"
              >
                <p className="text-sm leading-relaxed text-[var(--foreground)]">
                  {recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card-static p-6">
          <div className="flex items-center gap-2">
            <Sparkles size={15} style={{ color: "var(--violet-soft-text)" }} />
            <h3 className="text-sm font-medium text-[var(--foreground)]">
              Focus recomendado
            </h3>
          </div>

          {planning.focusTasks.length > 0 ? (
            <div className="mt-4 space-y-3">
              {planning.focusTasks.map((task, index) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => openBreakdownStudio(task.id)}
                  className={`rounded-[24px] border p-4 ${
                    task.id === activeSelectedTaskId
                      ? "border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)]"
                      : "border-[var(--glass-border)] bg-[var(--hover-overlay)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-xs font-semibold text-white">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[var(--foreground)]">
                        {task.title}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <TaskPriorityBadge priority={task.priority} />
                        <TaskDomainBadge domain={task.domain} />
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                        {task.carryOverCount > 0
                          ? `Arrastra ${task.carryOverCount} carry-over. Conviene resolverla temprano.`
                          : "Tiene el mejor balance entre prioridad y urgencia para entrar en foco hoy."}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[24px] border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-5 py-10 text-center">
              <p className="text-sm font-medium text-[var(--foreground)]">
                No hay foco forzado para hoy.
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                La cola esta liviana. Puedes capturar trabajo nuevo sin romper el plan.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="glass-card-static overflow-hidden">
          <div className="border-b border-[var(--glass-border)] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  Cola de ejecucion
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Acciones visibles, sin hover escondido. Lo importante queda al
                  frente.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { key: "focus", label: "Focus", count: getFilterTasks(tasks, "focus").length },
                  { key: "pending", label: "Pendientes", count: pendingTasks.length },
                  { key: "done", label: "Hechas", count: doneTasks.length },
                  { key: "all", label: "Todas", count: tasks.length },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key as TaskFilter)}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                      filter === item.key
                        ? "bg-[var(--accent)] text-white shadow-lg"
                        : "bg-[var(--hover-overlay)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {item.label} · {item.count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 p-5">
            {visibleTasks.length === 0 && (
              <div className="rounded-[28px] border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--violet-soft-bg)]">
                  <CheckCheck
                    size={24}
                    style={{ color: "var(--violet-soft-text)", opacity: 0.8 }}
                  />
                </div>
                <p className="mt-4 text-sm font-medium text-[var(--foreground)]">
                  {filter === "focus"
                    ? "No hay nada urgente en la cola."
                    : filter === "pending"
                      ? "No quedan pendientes para hoy."
                      : filter === "done"
                        ? "Todavia no cerraste tareas hoy."
                        : "No hay tareas para esta fecha."}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Usa captura rapida o conversa con el asistente para cargar el
                  siguiente bloque de trabajo.
                </p>
              </div>
            )}

            {visibleTasks.map((task) => {
              const busy = isTaskBusy(task.id);
              const actionsOpen = expandedTaskActions === task.id;
              return (
                <div
                  key={task.id}
                  className={`rounded-[20px] md:rounded-2xl border px-4 py-3 transition-all ${getTaskTone(task)}`}
                >
                  {/* ── Desktop: compact single row ── */}
                  <div className="hidden md:flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => task.status !== "done" && completeMutation.mutate(task.id)}
                      disabled={task.status === "done" || busy}
                      className={`task-checkbox shrink-0 ${task.status === "done" ? "checked" : ""}`}
                    >
                      {task.status === "done" && (
                        <Check size={14} className="text-white" />
                      )}
                    </button>

                    <span
                      className={`min-w-0 flex-1 truncate text-sm font-medium ${
                        task.status === "done"
                          ? "text-[var(--muted)] line-through"
                          : "text-[var(--foreground)]"
                      }`}
                      title={task.title}
                    >
                      {task.title}
                    </span>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <TaskPriorityBadge priority={task.priority} />
                      <TaskDomainBadge domain={task.domain} />
                      {task.carryOverCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--amber-soft-text)]">
                          <AlertTriangle size={10} />
                          {task.carryOverCount}
                        </span>
                      )}
                      {task.carryOverCount >= 3 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--red-soft-text)]">
                          Bloqueada
                        </span>
                      )}
                    </div>

                    {task.status !== "done" && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => completeMutation.mutate(task.id)}
                          disabled={busy}
                          title="Marcar como hecha"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)] text-white transition-all hover:scale-105 disabled:opacity-50"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => carryOverMutation.mutate(task.id)}
                          disabled={busy}
                          title="Llevar a manana"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] text-[var(--amber-soft-text)] transition-all hover:scale-105 disabled:opacity-50"
                        >
                          <ArrowRight size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openBreakdownStudio(task.id)}
                          title="Ver detalle"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] text-[var(--violet-soft-text)] transition-all hover:scale-105"
                        >
                          <ListTodo size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => discardMutation.mutate(task.id)}
                          disabled={busy}
                          title="Descartar"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] text-[var(--red-soft-text)] transition-all hover:scale-105 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                    {task.status === "done" && (
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(task.id)}
                        disabled={busy}
                        title="Borrar"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--muted)] transition-all hover:scale-105 hover:text-[var(--foreground)] disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* ── Mobile: card layout ── */}
                  <div className="flex flex-col gap-3 md:hidden">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => task.status !== "done" && completeMutation.mutate(task.id)}
                        disabled={task.status === "done" || busy}
                        className={`task-checkbox mt-0.5 shrink-0 ${task.status === "done" ? "checked" : ""}`}
                      >
                        {task.status === "done" && (
                          <Check size={14} className="text-white" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-sm font-medium leading-tight ${
                            task.status === "done"
                              ? "text-[var(--muted)] line-through"
                              : "text-[var(--foreground)]"
                          }`}
                        >
                          {task.title}
                        </span>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <TaskPriorityBadge priority={task.priority} />
                          <TaskDomainBadge domain={task.domain} />
                          {task.carryOverCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--amber-soft-text)]">
                              <AlertTriangle size={10} />
                              {task.carryOverCount}
                            </span>
                          )}
                          {task.carryOverCount >= 3 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--red-soft-text)]">
                              Bloqueada
                            </span>
                          )}
                        </div>
                      </div>

                      {task.status !== "done" ? (
                        <button
                          type="button"
                          onClick={() => setExpandedTaskActions(actionsOpen ? null : task.id)}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)]"
                        >
                          {actionsOpen ? <X size={14} /> : <MoreHorizontal size={14} />}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(task.id)}
                          disabled={busy}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)] disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {actionsOpen && task.status !== "done" && (
                      <div className="flex flex-wrap gap-2 border-t border-[var(--glass-border)]/80 pt-3">
                        <button
                          type="button"
                          onClick={() => { completeMutation.mutate(task.id); setExpandedTaskActions(null); }}
                          disabled={busy}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                        >
                          <Check size={13} />
                          Hecha
                        </button>
                        <button
                          type="button"
                          onClick={() => { carryOverMutation.mutate(task.id); setExpandedTaskActions(null); }}
                          disabled={busy}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-3 py-1.5 text-xs font-medium text-[var(--amber-soft-text)] transition-all hover:scale-[1.02] disabled:opacity-50"
                        >
                          <ArrowRight size={13} />
                          Manana
                        </button>
                        <button
                          type="button"
                          onClick={() => { openBreakdownStudio(task.id); setExpandedTaskActions(null); }}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] px-3 py-1.5 text-xs font-medium text-[var(--violet-soft-text)] transition-all hover:scale-[1.02]"
                        >
                          <ListTodo size={13} />
                          Detalle
                        </button>
                        <button
                          type="button"
                          onClick={() => { discardMutation.mutate(task.id); setExpandedTaskActions(null); }}
                          disabled={busy}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] px-3 py-1.5 text-xs font-medium text-[var(--red-soft-text)] transition-all hover:scale-[1.02] disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                          Descartar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card-static p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={15} style={{ color: "var(--violet-soft-text)" }} />
              <h3 className="text-sm font-medium text-[var(--foreground)]">
                Siguiente mejor accion
              </h3>
            </div>

            {topTask ? (
              <div className="mt-4 rounded-[24px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  En foco
                </div>
                <div className="mt-2 text-base font-medium text-[var(--foreground)]">
                  {topTask.title}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <TaskPriorityBadge priority={topTask.priority} />
                  <TaskDomainBadge domain={topTask.domain} />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
                  {topTask.status === "done"
                    ? "La cola visible ya tiene trabajo cerrado."
                    : topTask.carryOverCount > 0
                      ? "Conviene resolverla o descartarla antes de sumar mas friccion."
                      : "Es la pieza con mayor impacto inmediato segun prioridad y arrastre."}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">
                No hay tareas cargadas para hoy.
              </p>
            )}
          </div>

          <div ref={breakdownStudioRef} className="glass-card-static p-5 scroll-mt-24">
            <div className="flex items-center gap-2">
              <ListTodo size={15} style={{ color: "var(--violet-soft-text)" }} />
              <h3 className="text-sm font-medium text-[var(--foreground)]">
                Panel de detalle
              </h3>
            </div>

            {selectedTask ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                        Tarea seleccionada
                      </div>
                      <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
                        {selectedTask.title}
                      </div>
                    </div>
                    <span className="rounded-full border border-[var(--glass-border)] bg-white/40 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                      {selectedTask.status === "done" ? "Hecha" : "Activa"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <TaskPriorityBadge priority={selectedTask.priority} />
                    <TaskDomainBadge domain={selectedTask.domain} />
                  </div>
                  {selectedTask.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                      {selectedTask.description}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                      Sin descripcion adicional. Si necesitas preservar contexto
                      para retomarla mejor, guardalo como nota.
                    </p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                      Fecha
                    </div>
                    <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
                      {formatTaskDate(selectedTask.scheduledDate)}
                    </div>
                  </div>
                  <div className="rounded-[20px] border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                      Carry-over
                    </div>
                    <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
                      {selectedTask.carryOverCount}
                    </div>
                  </div>
                  <div className="rounded-[20px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                      Notas
                    </div>
                    <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
                      {selectedTaskNotes.length}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    Elegir tarea
                  </div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {pendingTasks.slice(0, 6).map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => openBreakdownStudio(task.id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                          task.id === activeSelectedTaskId
                            ? "bg-[var(--accent)] text-white shadow-lg"
                            : "bg-[var(--hover-overlay)] text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {task.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    Pasos sugeridos
                  </div>
                  <div className="space-y-2">
                    {breakdownSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.title}
                        className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3"
                      >
                        <div className="text-xs font-medium text-[var(--foreground)]">
                          {suggestion.title}
                        </div>
                        <div className="mt-2 space-y-2">
                          {suggestion.steps.map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() =>
                                addTaskNoteMutation.mutate({
                                  taskId: selectedTask.id,
                                  content: step,
                                  type: "breakdown_step",
                                })
                              }
                              disabled={addTaskNoteMutation.isPending}
                              className="block w-full rounded-xl border border-[var(--glass-border)] bg-white/40 px-3 py-2 text-left text-xs text-[var(--foreground)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {step}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    Agregar siguiente paso
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newBreakdownStep}
                      onChange={(e) => setNewBreakdownStep(e.target.value)}
                      placeholder="Ej: abrir documento y definir entregable"
                      className="glass-input flex-1 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        selectedTask &&
                        addTaskNoteMutation.mutate({
                          taskId: selectedTask.id,
                          content: newBreakdownStep,
                          type: "breakdown_step",
                        })
                      }
                      disabled={
                        !selectedTask ||
                        !newBreakdownStep.trim() ||
                        addTaskNoteMutation.isPending
                      }
                      className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={14} />
                      Agregar
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    Pasos persistidos
                  </div>
                  {persistedSteps.length > 0 ? (
                    <div className="space-y-2">
                      {persistedSteps.map((note: TaskNote) => (
                        <div
                          key={note.id}
                          className="rounded-2xl border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] px-3 py-3 text-sm text-[var(--foreground)]"
                        >
                          <div className="mb-2 inline-flex rounded-full border border-[var(--violet-soft-border)] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--violet-soft-text)]">
                            Paso
                          </div>
                          <div>{note.content}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-6 text-center text-xs text-[var(--muted)]">
                      Todavia no hay pasos guardados para esta tarea.
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    Guardar nota
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={newTaskNoteType}
                        onChange={(e) =>
                          setNewTaskNoteType(e.target.value as TaskNote["type"])
                        }
                        className="glass-input w-40 px-3 py-2 text-sm"
                      >
                        <option value="note">Nota</option>
                        <option value="blocker">Bloqueo</option>
                      </select>
                      <input
                        value={newTaskNote}
                        onChange={(e) => setNewTaskNote(e.target.value)}
                        placeholder={
                          newTaskNoteType === "blocker"
                            ? "Ej: falta respuesta o recurso"
                            : "Ej: contexto para retomarla rapido"
                        }
                        className="glass-input flex-1 px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        selectedTask &&
                        addTaskNoteMutation.mutate({
                          taskId: selectedTask.id,
                          content: newTaskNote,
                          type: newTaskNoteType,
                        })
                      }
                      disabled={
                        !selectedTask ||
                        !newTaskNote.trim() ||
                        addTaskNoteMutation.isPending
                      }
                      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={14} />
                      Guardar nota
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    Bloqueos
                  </div>
                  {blockerNotes.length > 0 ? (
                    <div className="space-y-2">
                      {blockerNotes.map((note) => (
                        <div
                          key={note.id}
                          className={`rounded-2xl border px-3 py-3 text-sm ${noteTypeTone(note.type)}`}
                        >
                          <div className="mb-2 inline-flex rounded-full border border-current/20 px-2 py-1 text-[10px] uppercase tracking-[0.16em]">
                            {noteTypeLabel(note.type)}
                          </div>
                          <div>{note.content}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-6 text-center text-xs text-[var(--muted)]">
                      Sin bloqueos registrados.
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    Notas y contexto
                  </div>
                  {contextNotes.length > 0 ? (
                    <div className="space-y-2">
                      {contextNotes.map((note) => (
                        <div
                          key={note.id}
                          className={`rounded-2xl border px-3 py-3 text-sm ${noteTypeTone(note.type)}`}
                        >
                          <div className="mb-2 inline-flex rounded-full border border-current/20 px-2 py-1 text-[10px] uppercase tracking-[0.16em]">
                            {noteTypeLabel(note.type)}
                          </div>
                          <div>{note.content}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-6 text-center text-xs text-[var(--muted)]">
                      Todavia no hay notas de contexto para esta tarea.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                Selecciona una tarea pendiente para ver su detalle.
              </div>
            )}
          </div>

          <div className="glass-card-static p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} style={{ color: "var(--amber-soft-text)" }} />
              <h3 className="text-sm font-medium text-[var(--foreground)]">
                Tablero de recuperacion
              </h3>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
                <div className="text-xs text-[var(--muted)]">Pendientes</div>
                <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                  {review?.pending ?? pendingTasks.length}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] p-4">
                <div className="text-xs text-[var(--muted)]">Con carry-over</div>
                <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                  {pendingTasks.filter((task) => task.carryOverCount > 0).length}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] p-4">
                <div className="text-xs text-[var(--muted)]">Bloqueadas</div>
                <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                  {stuckTasks.length}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card-static p-5">
            <div className="flex items-center gap-2">
              <BarChart3 size={15} style={{ color: "var(--violet-soft-text)" }} />
              <h3 className="text-sm font-medium text-[var(--foreground)]">
                Ritmo semanal
              </h3>
            </div>

            {trend && trend.length > 0 ? (
              <div className="mt-5 flex gap-2">
                {trend.slice().reverse().map((day) => (
                  <div key={day.date} className="flex-1 text-center">
                    <div className="mb-2 flex h-24 items-end justify-center">
                      <div
                        className="w-full max-w-[26px] rounded-t-xl"
                        style={{
                          height: `${Math.max(6, day.completionRate)}%`,
                          background:
                            day.date === today
                              ? "linear-gradient(to top, var(--accent-secondary), var(--accent))"
                              : "linear-gradient(to top, var(--violet-soft-bg), var(--violet-soft-border))",
                        }}
                      />
                    </div>
                    <div className="text-[9px] text-[var(--muted)]">
                      {day.date.slice(5)}
                    </div>
                    <div className="text-[10px] font-medium text-[var(--foreground)]">
                      {day.completionRate}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">
                Todavia no hay tendencia suficiente.
              </p>
            )}
          </div>
        </div>
      </section>

      {showClarificationGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] border border-[var(--amber-soft-border)] bg-[var(--sidebar)] p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-[var(--foreground)]">
              <Sparkles size={15} style={{ color: "var(--amber-soft-text)" }} />
              <h4 className="text-sm font-medium">Aclara la tarea antes de cargarla</h4>
            </div>

            <div className="mt-3 space-y-2">
              {draftClarification.reasons.map((reason) => (
                <p key={reason} className="text-xs leading-relaxed text-[var(--muted)]">
                  {reason}
                </p>
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                  Resultado esperado
                </label>
                <input
                  value={clarificationOutcome}
                  onChange={(e) => setClarificationOutcome(e.target.value)}
                  placeholder="Que tiene que quedar resuelto?"
                  className="glass-input w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                  Siguiente paso concreto
                </label>
                <input
                  value={clarificationNextStep}
                  onChange={(e) => setClarificationNextStep(e.target.value)}
                  placeholder="Cual es la siguiente accion visible?"
                  className="glass-input w-full px-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                Ejemplos
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                {draftClarification.examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => {
                      setNewTitle(example);
                      setShowClarificationGate(false);
                    }}
                    className="block w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-3 text-left text-xs text-[var(--foreground)] transition-all hover:translate-y-[-1px]"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => submitTask(true)}
                disabled={
                  !clarificationOutcome.trim() && !clarificationNextStep.trim()
                }
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check size={14} />
                Guardar clarificada
              </button>
              <button
                type="button"
                onClick={() => setShowClarificationGate(false)}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-all hover:translate-y-[-1px]"
              >
                Seguir editando
              </button>
              <button
                type="button"
                onClick={() => submitTask(true, false)}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--hover-overlay)] px-4 py-2 text-sm font-medium text-[var(--amber-soft-text)] transition-all hover:translate-y-[-1px]"
              >
                Crear igual
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
