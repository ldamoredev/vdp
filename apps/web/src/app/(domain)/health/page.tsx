"use client";

import { useQuery } from "@tanstack/react-query";
import { healthApi } from "@/lib/api/health";
import { formatMetricValue, formatRelative } from "@/lib/format";
import { Footprints, Moon, Droplets, Flame, Zap, Smile, CalendarClock, Pill, Activity, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const metricConfig: Record<string, { label: string; icon: any; color: string; target?: number; unit: string }> = {
  steps: { label: "Pasos", icon: Footprints, color: "emerald", target: 10000, unit: "steps" },
  sleep_hours: { label: "Sueno", icon: Moon, color: "blue", target: 8, unit: "hours" },
  water_ml: { label: "Agua", icon: Droplets, color: "cyan", target: 2500, unit: "ml" },
  calories: { label: "Calorias", icon: Flame, color: "amber", target: 2200, unit: "kcal" },
  energy: { label: "Energia", icon: Zap, color: "yellow", target: 5, unit: "scale" },
  mood: { label: "Animo", icon: Smile, color: "purple", target: 5, unit: "scale" },
};

const colorMap: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-400",
  blue: "bg-blue-500/15 text-blue-400",
  cyan: "bg-cyan-500/15 text-cyan-400",
  amber: "bg-amber-500/15 text-amber-400",
  yellow: "bg-yellow-500/15 text-yellow-400",
  purple: "bg-purple-500/15 text-purple-400",
};

export default function HealthDashboard() {
  const { data: today } = useQuery({
    queryKey: ["health", "today"],
    queryFn: healthApi.getTodaySummary,
  });

  const { data: weeklyStats } = useQuery({
    queryKey: ["health", "weekly-stats"],
    queryFn: healthApi.getWeeklyStats,
  });

  const { data: appointments } = useQuery({
    queryKey: ["health", "appointments"],
    queryFn: () => healthApi.getAppointments("upcoming"),
  });

  const { data: medications } = useQuery({
    queryKey: ["health", "medications"],
    queryFn: () => healthApi.getMedications(),
  });

  const { data: habits } = useQuery({
    queryKey: ["health", "habits"],
    queryFn: () => healthApi.getHabits(),
  });

  const todayMetrics = today?.metrics || {};

  const metricCards = Object.entries(metricConfig).map(([type, config]) => {
    const metric = todayMetrics[type];
    const value = metric ? parseFloat(metric.value) : 0;
    const pct = config.target ? Math.min(100, Math.round((value / config.target) * 100)) : 0;
    return {
      type,
      ...config,
      value: metric ? formatMetricValue(metric.value, config.unit) : "--",
      targetLabel: config.target ? `/ ${formatMetricValue(config.target, config.unit)}` : "",
      pct,
      hasData: !!metric,
    };
  });

  const weeklyChartData = weeklyStats?.map((s: any) => ({
    type: metricConfig[s.metricType]?.label || s.metricType,
    avg: parseFloat(s.avg),
    count: s.count,
  })) || [];

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-[var(--muted)] mt-1">Tu salud de hoy</p>
      </div>

      {/* Today metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
        {metricCards.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.type} className="glass-card p-4 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[var(--foreground-muted)]">{m.label}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorMap[m.color]}`}>
                  <Icon size={13} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-semibold tracking-tight ${!m.hasData ? "text-[var(--muted)]" : ""}`}>
                  {m.value}
                </span>
              </div>
              {m.targetLabel && (
                <>
                  <span className="text-[10px] text-[var(--muted)]">{m.targetLabel}</span>
                  <div className="progress-bar mt-2">
                    <div className="progress-bar-fill green" style={{ width: `${m.pct}%` }} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly summary chart */}
        <div className="lg:col-span-2 glass-card-static p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <TrendingUp size={15} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-medium">Resumen semanal</h3>
              <p className="text-xs text-[var(--muted)]">Promedio de los ultimos 7 dias</p>
            </div>
          </div>
          {weeklyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weeklyChartData}>
                <XAxis dataKey="type" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--glass-border)" }} />
                <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.9)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(148, 163, 184, 0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                  }}
                  cursor={{ fill: "rgba(255, 255, 255, 0.02)" }}
                />
                <Bar dataKey="avg" fill="#10B981" name="Promedio" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-sm text-[var(--muted)]">
              No hay datos de la ultima semana
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Upcoming appointments */}
          <div className="glass-card-static overflow-hidden">
            <div className="p-4 border-b border-[var(--glass-border)]">
              <div className="flex items-center gap-2">
                <CalendarClock size={16} className="text-blue-400" />
                <h3 className="font-medium text-sm">Proximas citas</h3>
              </div>
            </div>
            <div className="divide-y divide-[var(--glass-border)]">
              {appointments && appointments.length > 0 ? (
                appointments.slice(0, 3).map((a: any) => (
                  <div key={a.id} className="p-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <div className="text-sm font-medium">{a.title}</div>
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
            <div className="p-4 border-b border-[var(--glass-border)]">
              <div className="flex items-center gap-2">
                <Pill size={16} className="text-emerald-400" />
                <h3 className="font-medium text-sm">Medicamentos activos</h3>
              </div>
            </div>
            <div className="divide-y divide-[var(--glass-border)]">
              {medications && medications.length > 0 ? (
                medications.slice(0, 4).map((med: any) => (
                  <div key={med.id} className="p-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <div>
                      <div className="text-sm font-medium">{med.name}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {med.dosage} - {med.timeOfDay || med.frequency}
                      </div>
                    </div>
                    <div className="badge badge-green text-[10px]">{med.frequency}</div>
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

      {/* Active habits summary */}
      {habits && habits.length > 0 && (
        <div className="glass-card-static p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Activity size={15} className="text-purple-400" />
            </div>
            <h3 className="font-medium">Habitos activos</h3>
            <span className="text-xs text-[var(--muted)]">{habits.length} habitos</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {habits.slice(0, 8).map((h: any) => (
              <div key={h.id} className="glass-card p-3 text-center">
                <div className="text-lg mb-1">{h.icon || "📋"}</div>
                <div className="text-sm font-medium truncate">{h.name}</div>
                <div className="text-xs text-[var(--muted)]">{h.frequency}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
