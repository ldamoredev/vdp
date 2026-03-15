"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatMetricValue, formatDate } from "@/lib/format";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, X, Activity } from "lucide-react";

const metricTypes = [
  { value: "sleep_hours", label: "Sueno (horas)", unit: "hours", color: "#3B82F6" },
  { value: "steps", label: "Pasos", unit: "steps", color: "#10B981" },
  { value: "water_ml", label: "Agua (ml)", unit: "ml", color: "#06B6D4" },
  { value: "calories", label: "Calorias", unit: "kcal", color: "#F59E0B" },
  { value: "mood", label: "Animo (1-5)", unit: "scale", color: "#A855F7" },
  { value: "energy", label: "Energia (1-5)", unit: "scale", color: "#EAB308" },
  { value: "heart_rate", label: "Frec. cardiaca", unit: "bpm", color: "#EF4444" },
  { value: "weight", label: "Peso (kg)", unit: "kg", color: "#8B5CF6" },
];

export default function MetricsPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState("sleep_hours");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ metricType: "sleep_hours", value: "", notes: "" });

  const selectedMeta = metricTypes.find((t) => t.value === selectedType)!;

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["health", "metrics", selectedType],
    queryFn: () => api.getMetrics({ metricType: selectedType, limit: "60" }),
  });

  const logMutation = useMutation({
    mutationFn: api.logMetric,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health"] });
      setShowForm(false);
      setForm({ metricType: selectedType, value: "", notes: "" });
    },
  });

  const chartData = (metrics || [])
    .slice()
    .reverse()
    .map((m: any) => ({
      date: formatDate(m.recordedAt, "d/M"),
      value: parseFloat(m.value),
      fullDate: formatDate(m.recordedAt),
    }));

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Metricas</h2>
          <p className="text-sm text-[var(--muted)] mt-1">Seguimiento de tus datos de salud</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm({ ...form, metricType: selectedType }); }} className="btn-primary">
          <Plus size={16} /> Registrar
        </button>
      </div>

      {/* Metric type selector */}
      <div className="flex flex-wrap gap-2">
        {metricTypes.map((t) => (
          <button
            key={t.value}
            onClick={() => setSelectedType(t.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedType === t.value
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "glass-card text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card-static p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Activity size={15} className="text-emerald-400" />
          </div>
          <h3 className="font-medium">{selectedMeta.label}</h3>
          {metrics && <span className="text-xs text-[var(--muted)]">{metrics.length} registros</span>}
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
              <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.9)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(148, 163, 184, 0.1)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [formatMetricValue(value, selectedMeta.unit), selectedMeta.label]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={selectedMeta.color}
                strokeWidth={2}
                dot={{ fill: selectedMeta.color, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-sm text-[var(--muted)]">
            {isLoading ? "Cargando..." : "No hay datos para esta metrica"}
          </div>
        )}
      </div>

      {/* Recent values table */}
      {metrics && metrics.length > 0 && (
        <div className="glass-card-static overflow-hidden">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Valor</th>
                <th>Fuente</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {metrics.slice(0, 15).map((m: any) => (
                <tr key={m.id}>
                  <td className="text-[var(--foreground-muted)]">{formatDate(m.recordedAt)}</td>
                  <td className="font-medium">{formatMetricValue(m.value, m.unit)}</td>
                  <td><span className="badge badge-muted">{m.source}</span></td>
                  <td className="text-[var(--muted)] text-sm">{m.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="glass-card-static p-6 w-full max-w-md mx-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Registrar metrica</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-white/[0.04] cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                logMutation.mutate({
                  metricType: form.metricType,
                  value: parseFloat(form.value),
                  notes: form.notes || undefined,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1.5">Tipo</label>
                <select
                  value={form.metricType}
                  onChange={(e) => setForm({ ...form, metricType: e.target.value })}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                >
                  {metricTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1.5">Valor</label>
                <input
                  type="number"
                  step="any"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  placeholder="Ej: 7.5"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1.5">Notas (opcional)</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  placeholder="Notas adicionales..."
                />
              </div>
              <button type="submit" disabled={logMutation.isPending || !form.value} className="btn-primary w-full justify-center">
                {logMutation.isPending ? "Guardando..." : "Guardar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
