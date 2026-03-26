"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  History,
  ListChecks,
  Lock,
  TrendingUp,
} from "lucide-react";
import { tasksApi } from "@/lib/api/tasks";
import { formatDateShort, getTodayISO } from "@/lib/format";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { domains } from "@/lib/navigation";

const disabledDomains = domains.filter((d) => d.disabled);

export default function HomePage() {
  const today = getTodayISO();

  const { data: taskStats } = useQuery({
    queryKey: ["home", "task-stats"],
    queryFn: tasksApi.getTodayStats,
  });

  const { data: todayTasks } = useQuery({
    queryKey: ["home", "tasks-today"],
    queryFn: () => tasksApi.getTasks({ scheduledDate: today, limit: "5" }),
  });

  const { data: review } = useQuery({
    queryKey: ["home", "review", today],
    queryFn: () => tasksApi.getReview(today),
  });

  const { data: trend } = useQuery({
    queryKey: ["home", "trend", 7],
    queryFn: () => tasksApi.getTrend(7),
  });

  const tasksCompleted = taskStats?.completed ?? 0;
  const tasksTotal = taskStats?.total ?? 0;
  const tasksPending = taskStats?.pending ?? 0;
  const tasksPct = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
  const activeTasks = todayTasks?.tasks ?? [];
  const averageCompletion = trend?.length
    ? Math.round(trend.reduce((acc, day) => acc + day.completionRate, 0) / trend.length)
    : 0;
  const carriedToday = activeTasks.filter((task) => task.carryOverCount > 0).length;

  return (
    <div className="max-w-6xl space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Centro de comando
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Tu sistema operativo personal — un dominio a la vez
        </p>
      </div>

      {/* ─── Active: Tasks stats row ─── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 stagger-children">
        <Link
          href="/tasks"
          className="glass-card group cursor-pointer p-5 transition-all"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "var(--violet-soft-bg)" }}
              >
                <ListChecks size={15} style={{ color: "var(--violet-soft-text)" }} />
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">
                Tareas
              </span>
            </div>
            <ChevronRight
              size={14}
              className="text-[var(--muted)] transition-colors group-hover:text-[var(--violet-soft-text)]"
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-[var(--foreground)]">
              {tasksCompleted}
            </span>
            <span className="text-sm text-[var(--muted)]">
              / {tasksTotal} completadas
            </span>
          </div>
          <div className="progress-bar mt-3">
            <div
              className="progress-bar-fill"
              style={{ width: `${tasksPct}%`, background: "#8B5CF6" }}
            />
          </div>
        </Link>

        <div className="glass-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "var(--amber-soft-bg)" }}
              >
                <AlertTriangle size={15} style={{ color: "var(--amber-soft-text)" }} />
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">
                Pendientes
              </span>
            </div>
            <span className="text-xs font-medium text-[var(--muted)]">Hoy</span>
          </div>
          <div className="text-3xl font-semibold text-[var(--foreground)]">
            {tasksPending}
          </div>
          <span className="mt-1 block text-xs text-[var(--muted)]">
            {tasksPending === 0 ? "Dia limpio" : "Quedan tareas abiertas"}
          </span>
        </div>

        <Link
          href="/tasks/history"
          className="glass-card group cursor-pointer p-5 transition-all"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "var(--violet-soft-bg)" }}
              >
                <TrendingUp size={15} style={{ color: "var(--violet-soft-text)" }} />
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">
                Promedio semanal
              </span>
            </div>
            <ChevronRight
              size={14}
              className="text-[var(--muted)] transition-colors group-hover:text-[var(--violet-soft-text)]"
            />
          </div>
          <div className="text-3xl font-semibold text-[var(--foreground)]">
            {averageCompletion}%
          </div>
          <span className="mt-1 block text-xs text-[var(--muted)]">
            Tasa media de completacion en 7 dias
          </span>
        </Link>
      </div>

      {/* ─── Main content grid ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Today's tasks */}
          <div className="glass-card-static overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
              <div className="flex items-center gap-2">
                <ListChecks size={16} style={{ color: "var(--violet-soft-text)" }} />
                <h3 className="text-sm font-medium text-[var(--foreground)]">
                  Tareas de hoy
                </h3>
              </div>
              <Link
                href="/tasks"
                className="text-xs transition-colors"
                style={{ color: "var(--violet-soft-text)" }}
              >
                Ver todas
              </Link>
            </div>
            <div className="divide-y divide-[var(--divider)]">
              {activeTasks.length > 0 ? (
                activeTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 transition-colors hover:bg-[var(--hover-overlay)]"
                  >
                    {task.status === "done" ? (
                      <CheckCircle2
                        size={16}
                        style={{ color: "var(--emerald-soft-text)" }}
                        className="shrink-0"
                      />
                    ) : (
                      <div className="h-4 w-4 shrink-0 rounded-md border border-[var(--glass-border)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-sm ${
                          task.status === "done"
                            ? "text-[var(--muted)] line-through"
                            : "text-[var(--foreground)]"
                        }`}
                      >
                        {task.title}
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <TaskPriorityBadge priority={task.priority} />
                        <span className="text-[10px] text-[var(--muted)]">
                          {formatDateShort(task.scheduledDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[var(--muted)]">
                  No hay tareas para hoy
                </div>
              )}
            </div>
          </div>

          {/* Day review */}
          <div className="glass-card-static overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
              <div className="flex items-center gap-2">
                <History size={16} style={{ color: "var(--violet-soft-text)" }} />
                <h3 className="text-sm font-medium text-[var(--foreground)]">
                  Revision del dia
                </h3>
              </div>
              <Link
                href="/tasks/history"
                className="text-xs transition-colors"
                style={{ color: "var(--violet-soft-text)" }}
              >
                Abrir historial
              </Link>
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
                <div className="text-xs text-[var(--muted)]">Total</div>
                <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                  {review?.total ?? 0}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
                <div className="text-xs text-[var(--muted)]">Completadas</div>
                <div
                  className="mt-1 text-2xl font-semibold"
                  style={{ color: "var(--emerald-soft-text)" }}
                >
                  {review?.completed ?? 0}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
                <div className="text-xs text-[var(--muted)]">Carry-over</div>
                <div
                  className="mt-1 text-2xl font-semibold"
                  style={{ color: "var(--amber-soft-text)" }}
                >
                  {carriedToday}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Weekly trend */}
          <div className="glass-card-static overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} style={{ color: "var(--violet-soft-text)" }} />
                <h3 className="text-sm font-medium text-[var(--foreground)]">
                  Tendencia semanal
                </h3>
              </div>
              <span className="text-xs text-[var(--muted)]">Ultimos 7 dias</span>
            </div>
            <div className="space-y-3 p-4">
              {trend && trend.length > 0 ? (
                trend.map((day) => (
                  <div key={day.date} className="flex items-center gap-3">
                    <div className="w-16 text-xs text-[var(--muted)]">
                      {day.date.slice(5)}
                    </div>
                    <div className="flex-1">
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${Math.max(day.completionRate, 4)}%`,
                            background:
                              "linear-gradient(to right, var(--accent), var(--accent-secondary))",
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-right text-xs font-medium text-[var(--foreground)]">
                      {day.completionRate}%
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-[var(--muted)]">
                  Todavia no hay tendencia para mostrar.
                </div>
              )}
            </div>
          </div>

          {/* ─── Disabled domains: Proximamente ─── */}
          <div className="glass-card-static overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} style={{ color: "var(--violet-soft-text)" }} />
                <h3 className="text-sm font-medium text-[var(--foreground)]">
                  Dominios
                </h3>
              </div>
              <span className="text-xs text-[var(--muted)]">Vida digital</span>
            </div>
            <div className="space-y-2 p-4">
              {disabledDomains.map((domain) => (
                <div
                  key={domain.key}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3 opacity-40"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-[var(--background-secondary)]">
                    <span className="text-xs font-bold text-[var(--muted)]">
                      {domain.iconLetter}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-[var(--foreground)]">
                      {domain.label}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">
                      {domain.subtitle}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-[var(--glass-border)] px-2 py-0.5">
                    <Lock size={10} className="text-[var(--muted)]" />
                    <span className="text-[10px] font-medium text-[var(--muted)]">
                      Pronto
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
