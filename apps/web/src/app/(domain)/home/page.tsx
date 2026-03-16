"use client";

import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { walletApi } from "@/lib/api/wallet";
import { healthApi } from "@/lib/api/health";
import { formatMoney, formatMetricValue, formatRelative, getTodayISO } from "@/lib/format";
import Link from "next/link";
import {
  ListChecks,
  Wallet,
  Heart,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Footprints,
  Moon,
  Droplets,
  Flame,
  CalendarClock,
  Pill,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  const today = getTodayISO();

  // Tasks data
  const { data: taskStats } = useQuery({
    queryKey: ["home", "task-stats"],
    queryFn: tasksApi.getTodayStats,
  });

  const { data: todayTasks } = useQuery({
    queryKey: ["home", "tasks-today"],
    queryFn: () => tasksApi.getTasks({ scheduledDate: today, limit: "5" }),
  });

  // Wallet data
  const { data: accounts } = useQuery({
    queryKey: ["home", "accounts"],
    queryFn: walletApi.getAccounts,
  });

  const { data: recentTx } = useQuery({
    queryKey: ["home", "recent-tx"],
    queryFn: () => walletApi.getTransactions({ limit: "3" }),
  });

  // Health data
  const { data: healthToday } = useQuery({
    queryKey: ["home", "health-today"],
    queryFn: healthApi.getTodaySummary,
  });

  const { data: appointments } = useQuery({
    queryKey: ["home", "appointments"],
    queryFn: () => healthApi.getAppointments("upcoming"),
  });

  const { data: medications } = useQuery({
    queryKey: ["home", "medications"],
    queryFn: () => healthApi.getMedications(),
  });

  // Computed values
  const totalBalance = accounts?.reduce((sum: number, a: any) => sum + parseFloat(a.balance || 0), 0) || 0;
  const tasksCompleted = taskStats?.completed || 0;
  const tasksTotal = taskStats?.total || 0;
  const tasksPct = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

  const healthMetrics = healthToday?.metrics || {};
  const quickHealthCards = [
    { key: "steps", label: "Pasos", icon: Footprints, target: 10000, unit: "steps" },
    { key: "sleep_hours", label: "Sueno", icon: Moon, target: 8, unit: "hours" },
    { key: "water_ml", label: "Agua", icon: Droplets, target: 2500, unit: "ml" },
    { key: "calories", label: "Calorias", icon: Flame, target: 2200, unit: "kcal" },
  ];

  const txTypeIcons: Record<string, any> = {
    income: ArrowDownLeft,
    expense: ArrowUpRight,
  };

  return (
    <div className="space-y-8 max-w-6xl animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Buen dia</h2>
        <p className="text-sm text-[var(--muted)] mt-1">Tu resumen de hoy</p>
      </div>

      {/* Top summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        {/* Tasks summary */}
        <Link href="/tasks" className="glass-card p-5 group cursor-pointer transition-all" style={{ borderColor: undefined }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--violet-soft-bg)" }}>
                <ListChecks size={15} style={{ color: "var(--violet-soft-text)" }} />
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">Tareas</span>
            </div>
            <ChevronRight size={14} className="text-[var(--muted)] group-hover:text-[var(--violet-soft-text)] transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-[var(--foreground)]">{tasksCompleted}</span>
            <span className="text-sm text-[var(--muted)]">/ {tasksTotal} completadas</span>
          </div>
          <div className="progress-bar mt-3">
            <div className="progress-bar-fill" style={{ width: `${tasksPct}%`, background: "#8B5CF6" }} />
          </div>
        </Link>

        {/* Wallet summary */}
        <Link href="/wallet" className="glass-card p-5 group cursor-pointer transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--blue-soft-bg)" }}>
                <Wallet size={15} style={{ color: "var(--blue-soft-text)" }} />
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">Balance total</span>
            </div>
            <ChevronRight size={14} className="text-[var(--muted)] group-hover:text-[var(--blue-soft-text)] transition-colors" />
          </div>
          <div className="text-3xl font-semibold text-[var(--foreground)]">
            {formatMoney(totalBalance, "ARS")}
          </div>
          <span className="text-xs text-[var(--muted)] mt-1 block">
            {accounts?.length || 0} cuenta{(accounts?.length || 0) !== 1 ? "s" : ""}
          </span>
        </Link>

        {/* Health summary */}
        <Link href="/health" className="glass-card p-5 group cursor-pointer transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--emerald-soft-bg)" }}>
                <Heart size={15} style={{ color: "var(--emerald-soft-text)" }} />
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">Salud hoy</span>
            </div>
            <ChevronRight size={14} className="text-[var(--muted)] group-hover:text-[var(--emerald-soft-text)] transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {quickHealthCards.slice(0, 4).map((card) => {
              const metric = healthMetrics[card.key];
              const value = metric ? parseFloat(metric.value) : 0;
              const pct = card.target ? Math.min(100, Math.round((value / card.target) * 100)) : 0;
              return (
                <div key={card.key} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: pct >= 80 ? "var(--accent-green)" : pct >= 40 ? "var(--accent-amber)" : "var(--muted)" }} />
                  <span className="text-xs text-[var(--foreground-muted)] truncate">{card.label}</span>
                  <span className="text-xs font-medium ml-auto text-[var(--foreground)]">{metric ? formatMetricValue(metric.value, card.unit) : "--"}</span>
                </div>
              );
            })}
          </div>
        </Link>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Tasks + Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's tasks */}
          <div className="glass-card-static overflow-hidden">
            <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks size={16} style={{ color: "var(--violet-soft-text)" }} />
                <h3 className="font-medium text-sm text-[var(--foreground)]">Tareas de hoy</h3>
              </div>
              <Link href="/tasks" className="text-xs transition-colors" style={{ color: "var(--violet-soft-text)" }}>
                Ver todas
              </Link>
            </div>
            <div className="divide-y divide-[var(--divider)]">
              {todayTasks?.data && todayTasks.data.length > 0 ? (
                todayTasks.data.map((task: any) => (
                  <div key={task.id} className="p-3 flex items-center gap-3 hover:bg-[var(--hover-overlay)] transition-colors">
                    {task.status === "completed" ? (
                      <CheckCircle2 size={16} style={{ color: "var(--emerald-soft-text)" }} className="shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-md border border-[var(--glass-border)] shrink-0" />
                    )}
                    <span className={`text-sm flex-1 ${task.status === "completed" ? "line-through text-[var(--muted)]" : "text-[var(--foreground)]"}`}>
                      {task.title}
                    </span>
                    {task.priority >= 3 && (
                      <span className="badge badge-red text-[10px]">Alta</span>
                    )}
                    {task.priority === 2 && (
                      <span className="badge badge-amber text-[10px]">Media</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-xs text-[var(--muted)] text-center">
                  No hay tareas para hoy
                </div>
              )}
            </div>
          </div>

          {/* Recent transactions */}
          <div className="glass-card-static overflow-hidden">
            <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={16} style={{ color: "var(--blue-soft-text)" }} />
                <h3 className="font-medium text-sm text-[var(--foreground)]">Movimientos recientes</h3>
              </div>
              <Link href="/wallet/transactions" className="text-xs transition-colors" style={{ color: "var(--blue-soft-text)" }}>
                Ver todos
              </Link>
            </div>
            <div className="divide-y divide-[var(--divider)]">
              {recentTx?.data && recentTx.data.length > 0 ? (
                recentTx.data.map((tx: any) => {
                  const TxIcon = txTypeIcons[tx.type] || ArrowUpRight;
                  const isIncome = tx.type === "income";
                  return (
                    <div key={tx.id} className="p-3 flex items-center gap-3 hover:bg-[var(--hover-overlay)] transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                           style={{ background: isIncome ? "var(--emerald-soft-bg)" : tx.type === "expense" ? "var(--red-soft-bg)" : "var(--blue-soft-bg)" }}>
                        <TxIcon size={14} style={{ color: isIncome ? "var(--emerald-soft-text)" : tx.type === "expense" ? "var(--red-soft-text)" : "var(--blue-soft-text)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[var(--foreground)] truncate">{tx.description || tx.categoryName || "Sin descripcion"}</div>
                        <div className="text-xs text-[var(--muted)]">{formatRelative(tx.date)}</div>
                      </div>
                      <span className={`text-sm font-medium ${isIncome ? "" : "text-[var(--foreground)]"}`} style={isIncome ? { color: "var(--emerald-soft-text)" } : undefined}>
                        {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                        {formatMoney(Math.abs(parseFloat(tx.amount)), tx.currency || "ARS")}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-xs text-[var(--muted)] text-center">
                  No hay movimientos recientes
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Health details */}
        <div className="space-y-6">
          {/* Health metrics */}
          <div className="glass-card-static overflow-hidden">
            <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} style={{ color: "var(--emerald-soft-text)" }} />
                <h3 className="font-medium text-sm text-[var(--foreground)]">Metricas de hoy</h3>
              </div>
              <Link href="/health/metrics" className="text-xs transition-colors" style={{ color: "var(--emerald-soft-text)" }}>
                Registrar
              </Link>
            </div>
            <div className="divide-y divide-[var(--divider)]">
              {quickHealthCards.map((card) => {
                const Icon = card.icon;
                const metric = healthMetrics[card.key];
                const value = metric ? parseFloat(metric.value) : 0;
                const pct = card.target ? Math.min(100, Math.round((value / card.target) * 100)) : 0;
                return (
                  <div key={card.key} className="p-3 flex items-center gap-3">
                    <Icon size={14} className="text-[var(--muted)]" />
                    <span className="text-sm flex-1 text-[var(--foreground)]">{card.label}</span>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {metric ? formatMetricValue(metric.value, card.unit) : "--"}
                    </span>
                    <div className="w-16 h-1.5 rounded-full bg-[var(--progress-track)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 80 ? "var(--accent-green)" : pct >= 40 ? "var(--accent-amber)" : "var(--muted)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming appointments */}
          <div className="glass-card-static overflow-hidden">
            <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock size={16} style={{ color: "var(--blue-soft-text)" }} />
                <h3 className="font-medium text-sm text-[var(--foreground)]">Proximas citas</h3>
              </div>
              <Link href="/health/appointments" className="text-xs transition-colors" style={{ color: "var(--blue-soft-text)" }}>
                Ver todas
              </Link>
            </div>
            <div className="divide-y divide-[var(--divider)]">
              {appointments && appointments.length > 0 ? (
                appointments.slice(0, 3).map((a: any) => (
                  <div key={a.id} className="p-3 hover:bg-[var(--hover-overlay)] transition-colors">
                    <div className="text-sm font-medium text-[var(--foreground)]">{a.title}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-[var(--muted)]">
                        {a.doctorName || a.specialty || ""}
                      </span>
                      <span className="text-xs text-[var(--foreground-muted)]">
                        {formatRelative(a.scheduledAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-xs text-[var(--muted)] text-center">
                  No hay citas programadas
                </div>
              )}
            </div>
          </div>

          {/* Active medications */}
          <div className="glass-card-static overflow-hidden">
            <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill size={16} style={{ color: "var(--emerald-soft-text)" }} />
                <h3 className="font-medium text-sm text-[var(--foreground)]">Medicamentos</h3>
              </div>
              <Link href="/health/medications" className="text-xs transition-colors" style={{ color: "var(--emerald-soft-text)" }}>
                Ver todos
              </Link>
            </div>
            <div className="divide-y divide-[var(--divider)]">
              {medications && medications.length > 0 ? (
                medications.slice(0, 3).map((med: any) => (
                  <div key={med.id} className="p-3 flex items-center justify-between hover:bg-[var(--hover-overlay)] transition-colors">
                    <div>
                      <div className="text-sm font-medium text-[var(--foreground)]">{med.name}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {med.dosage} - {med.timeOfDay || med.frequency}
                      </div>
                    </div>
                    <span className="badge badge-green text-[10px]">{med.frequency}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-xs text-[var(--muted)] text-center">
                  No hay medicamentos activos
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
