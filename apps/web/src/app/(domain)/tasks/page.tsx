"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { getTodayISO, priorityLabel, priorityBadge, domainLabel, domainBadge } from "@/lib/format";
import { Plus, Check, ArrowRight, Trash2, ChevronDown, AlertTriangle, Target, TrendingUp, BarChart3 } from "lucide-react";

const today = getTodayISO();

export default function TasksDashboard() {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState(2);
  const [newDomain, setNewDomain] = useState("");
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [filter, setFilter] = useState<string>("pending");

  // Queries
  const { data: tasksResult } = useQuery({
    queryKey: ["tasks", today, filter],
    queryFn: () => tasksApi.getTasks({ scheduledDate: today, ...(filter !== "all" ? { status: filter } : {}) }),
  });

  const { data: todayStats } = useQuery({
    queryKey: ["tasks", "stats", "today"],
    queryFn: tasksApi.getTodayStats,
  });

  const { data: trend } = useQuery({
    queryKey: ["tasks", "trend"],
    queryFn: () => tasksApi.getTrend(7),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: tasksApi.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewTitle("");
      setNewPriority(2);
      setNewDomain("");
      setShowAddOptions(false);
    },
  });

  const completeMutation = useMutation({
    mutationFn: tasksApi.completeTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const carryOverMutation = useMutation({
    mutationFn: (id: string) => tasksApi.carryOverTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const discardMutation = useMutation({
    mutationFn: tasksApi.discardTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const tasks = tasksResult?.data || [];
  const stats = todayStats;

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
    <div className="space-y-8 max-w-3xl animate-fade-in">
      {/* Header + Stats */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Hoy</h2>
          <p className="text-sm text-[var(--muted)] mt-1">Tu lista de tareas para hoy</p>
        </div>
        {stats && stats.total > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold tracking-tight">
                {stats.completed}<span className="text-[var(--muted)] text-lg">/{stats.total}</span>
              </div>
              <div className="text-xs text-[var(--muted)]">{stats.completionRate}% completado</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
              <Target size={20} className="text-violet-400" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Add */}
      <form onSubmit={handleCreate} className="glass-card-static p-4">
        <div className="flex gap-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Agregar tarea..."
            className="glass-input flex-1 px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || createMutation.isPending}
            className="btn-primary px-4"
          >
            <Plus size={16} />
            Agregar
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowAddOptions(!showAddOptions)}
          className="flex items-center gap-1 mt-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
        >
          <ChevronDown size={12} className={`transition-transform ${showAddOptions ? "rotate-180" : ""}`} />
          Opciones
        </button>
        {showAddOptions && (
          <div className="flex gap-4 mt-3 animate-fade-in">
            <div>
              <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Prioridad</label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewPriority(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      newPriority === p
                        ? p === 3 ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : p === 2 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                        : "glass-input border-transparent"
                    }`}
                  >
                    {priorityLabel(p)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Dominio</label>
              <select
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="glass-input block mt-1 px-3 py-1 text-xs cursor-pointer"
              >
                <option value="">Ninguno</option>
                <option value="wallet">Finanzas</option>
                <option value="health">Salud</option>
                <option value="work">Trabajo</option>
                <option value="people">Gente</option>
                <option value="study">Estudio</option>
              </select>
            </div>
          </div>
        )}
      </form>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: "pending", label: "Pendientes" },
          { key: "done", label: "Hechas" },
          { key: "all", label: "Todas" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              filter === f.key
                ? "bg-[var(--accent)] text-white shadow-lg shadow-violet-500/20"
                : "glass-card text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2 stagger-children">
        {tasks.length === 0 && (
          <div className="text-center py-16 glass-card-static">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={24} className="text-violet-400/50" />
            </div>
            <p className="text-sm text-[var(--muted)]">
              {filter === "pending" ? "No hay tareas pendientes. Agrega una!" : "No hay tareas"}
            </p>
          </div>
        )}
        {tasks.map((task: any) => (
          <div
            key={task.id}
            className={`glass-card p-4 flex items-center gap-4 group ${
              task.status === "done" ? "opacity-60" : ""
            }`}
          >
            {/* Checkbox */}
            <button
              onClick={() => task.status !== "done" && completeMutation.mutate(task.id)}
              className={`task-checkbox ${task.status === "done" ? "checked" : ""}`}
              disabled={task.status === "done"}
            >
              {task.status === "done" && <Check size={14} className="text-white" />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${task.status === "done" ? "line-through text-[var(--muted)]" : ""}`}>
                  {task.title}
                </span>
                {task.carryOverCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400">
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

            {/* Actions */}
            {task.status === "pending" && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => carryOverMutation.mutate(task.id)}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
                  title="Pasar a manana"
                >
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => discardMutation.mutate(task.id)}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                  title="Descartar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Weekly trend mini */}
      {trend && trend.length > 0 && (
        <div className="glass-card-static p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <TrendingUp size={15} className="text-violet-400" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Tendencia semanal</h3>
              <p className="text-xs text-[var(--muted)]">Tasa de completacion por dia</p>
            </div>
          </div>
          <div className="flex gap-2">
            {trend.slice().reverse().map((day: any) => (
              <div key={day.date} className="flex-1 text-center">
                <div className="h-24 flex items-end justify-center mb-2">
                  <div
                    className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-violet-600 to-violet-400 transition-all"
                    style={{ height: `${Math.max(4, day.completionRate)}%` }}
                  />
                </div>
                <div className="text-[10px] text-[var(--muted)]">
                  {day.date.slice(5)}
                </div>
                <div className="text-[10px] font-medium">
                  {day.completionRate}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
