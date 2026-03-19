"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { priorityLabel, priorityBadge, domainLabel, domainBadge } from "@/lib/format";
import { Check, AlertTriangle, ChevronLeft, ChevronRight, CalendarDays, BarChart3, PieChart } from "lucide-react";
import { format, subDays, addDays } from "date-fns";
import { es } from "date-fns/locale";

function toISO(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const dateISO = toISO(selectedDate);
  console.log(dateISO)

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

  const review = reviewResult;
  const tasks = tasksResult?.tasks || [];
  console.log(toISO(new Date()))
  const isToday = dateISO === toISO(new Date());
  console.log(isToday)

  function goBack() {
    setSelectedDate((d) => subDays(d, 1));
  }

  function goForward() {
    if (!isToday) setSelectedDate((d) => addDays(d, 1));
  }

  const completedTasks = tasks.filter((t: any) => t.status === "done");
  const pendingTasks = tasks.filter((t: any) => t.status === "pending");
  const discardedTasks = tasks.filter((t: any) => t.status === "discarded");

  return (
    <div className="space-y-8 max-w-4xl animate-fade-in">
      {/* Date navigator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Historial</h2>
          <p className="text-sm text-[var(--muted)] mt-1">Revisa tus dias anteriores</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)] transition-all cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 glass-card-static rounded-xl">
            <CalendarDays size={14} style={{ color: "var(--violet-soft-text)" }} />
            <span className="text-sm font-medium">
              {format(selectedDate, "EEEE, d MMM yyyy", { locale: es })}
            </span>
          </div>
          <button
            onClick={goForward}
            disabled={isToday}
            className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Day summary cards */}
      {review && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
          <div className="glass-card p-4">
            <div className="text-xs text-[var(--muted)] mb-1">Total</div>
            <div className="text-2xl font-bold tracking-tight">{review.total}</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-xs text-[var(--muted)] mb-1">Completadas</div>
            <div className="text-2xl font-bold tracking-tight" style={{ color: "var(--emerald-soft-text)" }}>{review.completed}</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-xs text-[var(--muted)] mb-1">Pendientes</div>
            <div className="text-2xl font-bold tracking-tight" style={{ color: "var(--amber-soft-text)" }}>{review.pending}</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-xs text-[var(--muted)] mb-1">Tasa</div>
            <div className="text-2xl font-bold tracking-tight" style={{ color: "var(--violet-soft-text)" }}>{review.completionRate}%</div>
          </div>
        </div>
      )}

      {/* Task lists by status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completed */}
        <div className="glass-card-static overflow-hidden">
          <div className="p-4 border-b border-[var(--glass-border)] flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--emerald-soft-bg)" }}>
              <Check size={12} style={{ color: "var(--emerald-soft-text)" }} />
            </div>
            <h3 className="font-medium text-sm">Completadas</h3>
            <span className="text-xs text-[var(--muted)] ml-auto">{completedTasks.length}</span>
          </div>
          <div className="divide-y divide-[var(--glass-border)]">
            {completedTasks.length > 0 ? (
              completedTasks.map((task: any) => (
                <div key={task.id} className="p-3 flex items-center gap-3">
                  <div className="task-checkbox checked flex-shrink-0">
                    <Check size={12} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm line-through text-[var(--muted)]">{task.title}</span>
                    <div className="flex items-center gap-2 mt-1">
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
                </div>
              ))
            ) : (
              <div className="p-4 text-xs text-[var(--muted)] text-center">
                No se completaron tareas
              </div>
            )}
          </div>
        </div>

        {/* Pending + Discarded */}
        <div className="space-y-6">
          <div className="glass-card-static overflow-hidden">
            <div className="p-4 border-b border-[var(--glass-border)] flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--amber-soft-bg)" }}>
                <AlertTriangle size={12} style={{ color: "var(--amber-soft-text)" }} />
              </div>
              <h3 className="font-medium text-sm">Pendientes</h3>
              <span className="text-xs text-[var(--muted)] ml-auto">{pendingTasks.length}</span>
            </div>
            <div className="divide-y divide-[var(--glass-border)]">
              {pendingTasks.length > 0 ? (
                pendingTasks.map((task: any) => (
                  <div key={task.id} className="p-3 flex items-center gap-3">
                    <div className="w-4 h-4 rounded-md border flex-shrink-0" style={{ borderColor: "var(--amber-soft-border)" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{task.title}</span>
                        {task.carryOverCount > 0 && (
                          <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--amber-soft-text)" }}>
                            <AlertTriangle size={10} />
                            {task.carryOverCount}x
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
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
                  </div>
                ))
              ) : (
                <div className="p-4 text-xs text-[var(--muted)] text-center">
                  Sin tareas pendientes
                </div>
              )}
            </div>
          </div>

          {discardedTasks.length > 0 && (
            <div className="glass-card-static overflow-hidden">
              <div className="p-4 border-b border-[var(--glass-border)] flex items-center gap-2">
                <h3 className="font-medium text-sm text-[var(--muted)]">Descartadas</h3>
                <span className="text-xs text-[var(--muted)] ml-auto">{discardedTasks.length}</span>
              </div>
              <div className="divide-y divide-[var(--glass-border)]">
                {discardedTasks.map((task: any) => (
                  <div key={task.id} className="p-3">
                    <span className="text-sm text-[var(--muted)] line-through">{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 14-day trend */}
      {trend && trend.length > 0 && (
        <div className="glass-card-static p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--violet-soft-bg)" }}>
              <BarChart3 size={15} style={{ color: "var(--violet-soft-text)" }} />
            </div>
            <div>
              <h3 className="font-medium text-sm">Tendencia 14 dias</h3>
              <p className="text-xs text-[var(--muted)]">Tasa de completacion diaria</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {trend.slice().reverse().map((day: any) => (
              <div key={day.date} className="flex-1 text-center">
                <div className="h-28 flex items-end justify-center mb-2">
                  <div
                    className="w-full max-w-[24px] rounded-t-lg transition-all"
                    style={{
                      background: day.date === dateISO
                        ? "linear-gradient(to top, var(--violet-soft-border), var(--violet-soft-text))"
                        : "linear-gradient(to top, var(--violet-soft-bg), var(--violet-soft-border))",
                      opacity: day.date === dateISO ? 1 : 0.7,
                      height: `${Math.max(4, day.completionRate)}%`,
                    }}
                  />
                </div>
                <div className={`text-[9px] ${day.date === dateISO ? "font-medium" : "text-[var(--muted)]"}`} style={day.date === dateISO ? { color: "var(--violet-soft-text)" } : undefined}>
                  {day.date.slice(8)}
                </div>
                <div className="text-[9px] font-medium" style={day.date === dateISO ? { color: "var(--violet-soft-text)" } : undefined}>
                  {day.completionRate}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain breakdown */}
      {domainStats && domainStats.length > 0 && (
        <div className="glass-card-static p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--violet-soft-bg)" }}>
              <PieChart size={15} style={{ color: "var(--violet-soft-text)" }} />
            </div>
            <div>
              <h3 className="font-medium text-sm">Por dominio</h3>
              <p className="text-xs text-[var(--muted)]">Distribucion de tareas completadas</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {domainStats.map((ds: any) => (
              <div key={ds.domain || "none"} className="glass-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`badge text-[10px] ${domainBadge(ds.domain)}`}>
                    {domainLabel(ds.domain) || "Sin dominio"}
                  </span>
                </div>
                <div className="text-lg font-bold">{ds.completed}</div>
                <div className="text-[10px] text-[var(--muted)]">de {ds.total} tareas</div>
                <div className="progress-bar mt-2">
                  <div
                    className="progress-bar-fill green"
                    style={{ width: `${ds.total > 0 ? Math.round((ds.completed / ds.total) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
