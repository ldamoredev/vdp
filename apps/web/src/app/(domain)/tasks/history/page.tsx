"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  History,
  PieChart,
  Sparkles,
  Trash2,
} from "lucide-react";
import { addDays, format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { tasksApi } from "@/lib/api/tasks";
import type { Task } from "@/lib/api/types";
import {
  domainBadge,
  domainLabel,
  priorityBadge,
  priorityLabel,
} from "@/lib/format";
import { syncTaskQueryState } from "@/lib/tasks/chat-sync";

type ReviewSignalTone = "success" | "info" | "warning" | "error";

type ReviewSignal = {
  title: string;
  detail: string;
  tone: ReviewSignalTone;
};

function toISO(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function getReviewSignals(review: {
  pending: number;
  completionRate: number;
  pendingTasks: Task[];
}): ReviewSignal[] {
  const stuckTasks = review.pendingTasks.filter((task) => task.carryOverCount >= 3);
  const overloaded = review.pending >= 5 || review.completionRate < 50;

  if (review.pending === 0) {
    return [
      {
        title: "Cierre limpio",
        detail: "No quedan decisiones pendientes para este dia.",
        tone: "success",
      },
    ];
  }

  return [
    overloaded
      ? {
          title: "Dia sobrecargado",
          detail:
            "Conviene reprogramar solo lo rescatable y descartar el resto antes de arrastrarlo.",
          tone: "warning" as const,
        }
      : {
          title: "Cierre recuperable",
          detail:
            "El dia no esta cerrado, pero la deuda es manejable si decides ahora que sigue.",
          tone: "info" as const,
        },
    stuckTasks.length > 0
      ? {
          title: "Hay tareas bloqueadas",
          detail: `${stuckTasks.length} tarea${stuckTasks.length === 1 ? "" : "s"} arrastran demasiado carry-over y necesitan resolucion explicita.`,
          tone: "error" as const,
        }
      : {
          title: "Sin bloqueo cronico",
          detail:
            "Las pendientes aun pueden moverse sin consolidar un patron de atasco.",
          tone: "success" as const,
        },
  ];
}

function getSignalToneClasses(tone: "success" | "info" | "warning" | "error") {
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

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const dateISO = toISO(selectedDate);
  const nextReviewDate = addDays(selectedDate, 1);
  const nextReviewISO = toISO(nextReviewDate);
  const isToday = dateISO === toISO(new Date());

  const { data: reviewResult } = useQuery({
    queryKey: ["tasks", "review", dateISO],
    queryFn: () => tasksApi.getReview(dateISO),
  });

  const { data: tasksResult } = useQuery({
    queryKey: ["tasks", dateISO, "all"],
    queryFn: () => tasksApi.getTasks({ scheduledDate: dateISO }),
  });

  const { data: trend } = useQuery({
    queryKey: ["tasks", "trend", 14],
    queryFn: () => tasksApi.getTrend(14),
  });

  const { data: domainStats } = useQuery({
    queryKey: ["tasks", "domain-stats"],
    queryFn: () => tasksApi.getByDomain(),
  });

  const carryOverMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.carryOverTask(taskId, nextReviewISO),
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

  const carryOverAllMutation = useMutation({
    mutationFn: () => tasksApi.carryOverAll(dateISO, nextReviewISO),
    onSuccess: (result) =>
      syncTaskQueryState({
        tool: "carry_over_all_pending",
        parsedResult: result,
        input: { fromDate: dateISO, toDate: nextReviewISO },
        queryClient,
      }),
  });

  const review = reviewResult;
  const tasks = tasksResult?.tasks || [];
  const completedTasks = tasks.filter((task) => task.status === "done");
  const pendingTasks = review?.pendingTasks || tasks.filter((task) => task.status === "pending");
  const discardedTasks = tasks.filter((task) => task.status === "discarded");
  const reviewSignals = review
    ? getReviewSignals({
        pending: review.pending,
        completionRate: review.completionRate,
        pendingTasks,
      })
    : [];

  function goBack() {
    setSelectedDate((d) => subDays(d, 1));
  }

  function goForward() {
    if (!isToday) setSelectedDate((d) => addDays(d, 1));
  }

  const isTaskBusy = (taskId: string) =>
    (carryOverMutation.isPending && carryOverMutation.variables === taskId) ||
    (discardMutation.isPending && discardMutation.variables === taskId);

  return (
    <div className="max-w-6xl space-y-8 animate-fade-in">
      <section className="glass-card-static overflow-hidden">
        <div className="border-b border-[var(--glass-border)] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                <History size={12} />
                Decision review
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                Cierra el dia con decisiones, no solo con metricas
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
                Revisa que quedo pendiente, decide que se mueve y corta el
                arrastre antes de que se convierta en ruido operativo.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                className="rounded-xl p-2 text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)]"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} style={{ color: "var(--violet-soft-text)" }} />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {format(selectedDate, "EEEE, d MMM yyyy", { locale: es })}
                  </span>
                </div>
              </div>
              <button
                onClick={goForward}
                disabled={isToday}
                className="rounded-xl p-2 text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {review && (
          <div className="grid gap-4 p-6 md:grid-cols-4">
            <div className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Total
              </div>
              <div className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                {review.total}
              </div>
            </div>
            <div className="rounded-[24px] border border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Completadas
              </div>
              <div className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                {review.completed}
              </div>
            </div>
            <div className="rounded-[24px] border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Pendientes
              </div>
              <div className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                {review.pending}
              </div>
            </div>
            <div className="rounded-[24px] border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Tasa
              </div>
              <div className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                {review.completionRate}%
              </div>
            </div>
          </div>
        )}
      </section>

      {review && (
        <section className="grid gap-4 md:grid-cols-2">
          {reviewSignals.map((signal) => (
            <div
              key={signal.title}
              className={`rounded-[28px] border p-5 ${getSignalToneClasses(signal.tone)}`}
            >
              <div className="flex items-center gap-2 text-[var(--foreground)]">
                <Sparkles size={14} />
                <h3 className="text-sm font-medium">{signal.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {signal.detail}
              </p>
            </div>
          ))}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
        <div className="glass-card-static overflow-hidden">
          <div className="border-b border-[var(--glass-border)] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  Cola de cierre
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Cada tarea pendiente necesita una decision: moverla o cerrarla.
                </p>
              </div>

              <button
                type="button"
                onClick={() => carryOverAllMutation.mutate()}
                disabled={pendingTasks.length === 0 || carryOverAllMutation.isPending}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-4 py-2 text-sm font-medium text-[var(--amber-soft-text)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CalendarRange size={15} />
                Mover todo a {format(nextReviewDate, "EEE d MMM", { locale: es })}
              </button>
            </div>
          </div>

          <div className="space-y-3 p-5">
            {pendingTasks.length === 0 && (
              <div className="rounded-[28px] border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--emerald-soft-bg)]">
                  <Check size={24} style={{ color: "var(--emerald-soft-text)" }} />
                </div>
                <p className="mt-4 text-sm font-medium text-[var(--foreground)]">
                  No quedan tareas abiertas para este dia.
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  El review ya esta resuelto. Solo queda observar el patron y
                  seguir con el siguiente bloque.
                </p>
              </div>
            )}

            {pendingTasks.map((task) => {
              const busy = isTaskBusy(task.id);
              return (
                <div
                  key={task.id}
                  className="rounded-[28px] border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {task.title}
                        </span>
                        {task.carryOverCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--amber-soft-border)] bg-[var(--hover-overlay)] px-2 py-1 text-[10px] font-medium text-[var(--amber-soft-text)]">
                            <AlertTriangle size={10} />
                            {task.carryOverCount}x
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
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
                        {task.carryOverCount >= 3
                          ? "Ya arrastra demasiada deuda. Si sigue viva, debe pasar al siguiente dia con intencion explicita."
                          : "Todavia esta abierta al final del dia. Decide ahora si merece continuar o si debe salir de la cola."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => carryOverMutation.mutate(task.id)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--hover-overlay)] px-3 py-2 text-xs font-medium text-[var(--amber-soft-text)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ArrowRight size={13} />
                        Llevar a {format(nextReviewDate, "EEE d MMM", { locale: es })}
                      </button>
                      <button
                        type="button"
                        onClick={() => discardMutation.mutate(task.id)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] px-3 py-2 text-xs font-medium text-[var(--red-soft-text)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                        Cerrar sin arrastrar
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
              <AlertTriangle size={15} style={{ color: "var(--amber-soft-text)" }} />
              <h3 className="text-sm font-medium text-[var(--foreground)]">
                Estado del cierre
              </h3>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
                <div className="text-xs text-[var(--muted)]">Pendientes</div>
                <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                  {review?.pending ?? 0}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] p-4">
                <div className="text-xs text-[var(--muted)]">Reprogramadas</div>
                <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                  {review?.carriedOver ?? 0}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] p-4">
                <div className="text-xs text-[var(--muted)]">Descartadas</div>
                <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                  {review?.discarded ?? 0}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card-static overflow-hidden">
            <div className="border-b border-[var(--glass-border)] p-4">
              <div className="flex items-center gap-2">
                <Check size={14} style={{ color: "var(--emerald-soft-text)" }} />
                <h3 className="text-sm font-medium text-[var(--foreground)]">
                  Completadas
                </h3>
                <span className="ml-auto text-xs text-[var(--muted)]">
                  {completedTasks.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-[var(--glass-border)]">
              {completedTasks.length > 0 ? (
                completedTasks.map((task) => (
                  <div key={task.id} className="p-3">
                    <div className="text-sm text-[var(--muted)] line-through">
                      {task.title}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`badge text-[10px] ${priorityBadge(task.priority)}`}>
                        {priorityLabel(task.priority)}
                      </span>
                      {task.domain && (
                        <span className={`badge text-[10px] ${domainBadge(task.domain)}`}>
                          {domainLabel(task.domain)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-xs text-[var(--muted)]">
                  No hubo cierres en este dia.
                </div>
              )}
            </div>
          </div>

          {discardedTasks.length > 0 && (
            <div className="glass-card-static overflow-hidden">
              <div className="border-b border-[var(--glass-border)] p-4">
                <div className="flex items-center gap-2">
                  <Trash2 size={14} style={{ color: "var(--red-soft-text)" }} />
                  <h3 className="text-sm font-medium text-[var(--foreground)]">
                    Descartadas
                  </h3>
                  <span className="ml-auto text-xs text-[var(--muted)]">
                    {discardedTasks.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-[var(--glass-border)]">
                {discardedTasks.map((task) => (
                  <div key={task.id} className="p-3">
                    <div className="text-sm text-[var(--muted)] line-through">
                      {task.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {trend && trend.length > 0 && (
        <section className="glass-card-static p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--violet-soft-bg)" }}>
              <BarChart3 size={15} style={{ color: "var(--violet-soft-text)" }} />
            </div>
            <div>
              <h3 className="font-medium text-sm">Tendencia 14 dias</h3>
              <p className="text-xs text-[var(--muted)]">Como viene cerrando tu ejecucion diaria</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {trend.slice().reverse().map((day) => (
              <div key={day.date} className="flex-1 text-center">
                <div className="mb-2 flex h-28 items-end justify-center">
                  <div
                    className="w-full max-w-[24px] rounded-t-lg transition-all"
                    style={{
                      background:
                        day.date === dateISO
                          ? "linear-gradient(to top, var(--violet-soft-border), var(--violet-soft-text))"
                          : "linear-gradient(to top, var(--violet-soft-bg), var(--violet-soft-border))",
                      opacity: day.date === dateISO ? 1 : 0.7,
                      height: `${Math.max(4, day.completionRate)}%`,
                    }}
                  />
                </div>
                <div
                  className={`text-[9px] ${day.date === dateISO ? "font-medium" : "text-[var(--muted)]"}`}
                  style={day.date === dateISO ? { color: "var(--violet-soft-text)" } : undefined}
                >
                  {day.date.slice(8)}
                </div>
                <div
                  className="text-[9px] font-medium"
                  style={day.date === dateISO ? { color: "var(--violet-soft-text)" } : undefined}
                >
                  {day.completionRate}%
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {domainStats && domainStats.length > 0 && (
        <section className="glass-card-static p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--violet-soft-bg)" }}>
              <PieChart size={15} style={{ color: "var(--violet-soft-text)" }} />
            </div>
            <div>
              <h3 className="font-medium text-sm">Por dominio</h3>
              <p className="text-xs text-[var(--muted)]">Distribucion de cierres completados</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {domainStats.map((stat: any) => (
              <div key={stat.domain || "none"} className="glass-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className={`badge text-[10px] ${domainBadge(stat.domain)}`}>
                    {domainLabel(stat.domain) || "Sin dominio"}
                  </span>
                </div>
                <div className="text-lg font-bold text-[var(--foreground)]">
                  {stat.completed}
                </div>
                <div className="text-[10px] text-[var(--muted)]">
                  de {stat.total} tareas
                </div>
                <div className="progress-bar mt-2">
                  <div
                    className="progress-bar-fill green"
                    style={{
                      width: `${stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
