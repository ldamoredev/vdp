"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  CheckCheck,
  Clock3,
  Flame,
  History,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { tasksApi } from "@/lib/api/tasks";
import type { Task } from "@/lib/api/types";
import {
  domainBadge,
  domainLabel,
  getTodayISO,
  priorityBadge,
  priorityLabel,
} from "@/lib/format";
import { syncTaskQueryState } from "@/lib/tasks/chat-sync";

const today = getTodayISO();

type TaskFilter = "focus" | "pending" | "done" | "all";

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

export default function TasksDashboard() {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState(2);
  const [newDomain, setNewDomain] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("focus");

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

  const isTaskBusy = (taskId: string) =>
    (completeMutation.isPending && completeMutation.variables === taskId) ||
    (carryOverMutation.isPending && carryOverMutation.variables === taskId) ||
    (discardMutation.isPending && discardMutation.variables === taskId) ||
    (deleteMutation.isPending && deleteMutation.variables === taskId);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    createMutation.mutate({
      title: newTitle.trim(),
      priority: newPriority,
      domain: newDomain || undefined,
    });
  }

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
              return (
                <div
                  key={task.id}
                  className={`rounded-[28px] border p-4 transition-all ${getTaskTone(task)}`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => task.status !== "done" && completeMutation.mutate(task.id)}
                          disabled={task.status === "done" || busy}
                          className={`task-checkbox mt-0.5 ${task.status === "done" ? "checked" : ""}`}
                        >
                          {task.status === "done" && (
                            <Check size={14} className="text-white" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                task.status === "done"
                                  ? "text-[var(--muted)] line-through"
                                  : "text-[var(--foreground)]"
                              }`}
                            >
                              {task.title}
                            </span>

                            {task.carryOverCount > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-2 py-1 text-[10px] font-medium text-[var(--amber-soft-text)]">
                                <AlertTriangle size={10} />
                                {task.carryOverCount} carry-over
                              </span>
                            )}

                            {task.carryOverCount >= 3 && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] px-2 py-1 text-[10px] font-medium text-[var(--red-soft-text)]">
                                Bloqueada
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`badge text-[10px] ${priorityBadge(task.priority)}`}>
                              {priorityLabel(task.priority)}
                            </span>
                            {task.domain && (
                              <span className={`badge text-[10px] ${domainBadge(task.domain)}`}>
                                {domainLabel(task.domain)}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
                              <Clock3 size={11} />
                              {task.status === "done"
                                ? "Cerrada hoy"
                                : task.carryOverCount > 0
                                  ? "Necesita cierre o replanificacion"
                                  : "Lista para ejecutar"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {task.status !== "done" && (
                        <>
                          <button
                            type="button"
                            onClick={() => completeMutation.mutate(task.id)}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Check size={13} />
                            Hecha
                          </button>
                          <button
                            type="button"
                            onClick={() => carryOverMutation.mutate(task.id)}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-3 py-2 text-xs font-medium text-[var(--amber-soft-text)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <ArrowRight size={13} />
                            Manana
                          </button>
                          <button
                            type="button"
                            onClick={() => discardMutation.mutate(task.id)}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] px-3 py-2 text-xs font-medium text-[var(--red-soft-text)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                            Descartar
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(task.id)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2 text-xs font-medium text-[var(--muted)] transition-all hover:translate-y-[-1px] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                        Borrar
                      </button>
                    </div>
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
                  <span className={`badge text-[10px] ${priorityBadge(topTask.priority)}`}>
                    {priorityLabel(topTask.priority)}
                  </span>
                  {topTask.domain && (
                    <span className={`badge text-[10px] ${domainBadge(topTask.domain)}`}>
                      {domainLabel(topTask.domain)}
                    </span>
                  )}
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
    </div>
  );
}
