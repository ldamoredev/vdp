"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatMetricValue, formatDate } from "@/lib/format";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, X, Scale } from "lucide-react";

const measurementTypes = [
  { value: "weight", label: "Peso", unit: "kg", color: "#8B5CF6" },
  { value: "height", label: "Altura", unit: "cm", color: "#06B6D4" },
  { value: "body_fat", label: "Grasa corporal", unit: "%", color: "#F59E0B" },
  { value: "blood_pressure_sys", label: "Presion sistolica", unit: "mmHg", color: "#EF4444" },
  { value: "blood_pressure_dia", label: "Presion diastolica", unit: "mmHg", color: "#F87171" },
  { value: "glucose", label: "Glucosa", unit: "mg/dL", color: "#10B981" },
];

export default function BodyPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState("weight");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ measurementType: "weight", value: "", notes: "" });

  const selectedMeta = measurementTypes.find((t) => t.value === selectedType)!;

  const { data: measurements, isLoading } = useQuery({
    queryKey: ["health", "body", selectedType],
    queryFn: () => api.getBodyMeasurements({ type: selectedType }),
  });

  const logMutation = useMutation({
    mutationFn: api.logBodyMeasurement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "body"] });
      setShowForm(false);
      setForm({ measurementType: selectedType, value: "", notes: "" });
    },
  });

  const chartData = (measurements || [])
    .slice()
    .reverse()
    .map((m: any) => ({
      date: formatDate(m.recordedAt, "d/M"),
      value: parseFloat(m.value),
    }));

  // Get latest and previous value for comparison
  const latest = measurements?.[0];
  const previous = measurements?.[1];
  const diff = latest && previous
    ? parseFloat(latest.value) - parseFloat(previous.value)
    : null;

  return (
    <div className="space-y-8 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Medidas corporales</h2>
          <p className="text-sm text-[var(--muted)] mt-1">Seguimiento de peso y mediciones</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm({ ...form, measurementType: selectedType }); }} className="btn-primary">
          <Plus size={16} /> Registrar
        </button>
      </div>

      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {measurementTypes.map((t) => (
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

      {/* Current value card */}
      {latest && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-5">
            <span className="text-xs text-[var(--muted)]">Ultimo registro</span>
            <div className="text-3xl font-semibold mt-2">
              {formatMetricValue(latest.value, latest.unit)}
            </div>
            <span className="text-xs text-[var(--muted)]">{formatDate(latest.recordedAt)}</span>
          </div>
          {diff !== null && (
            <div className="glass-card p-5">
              <span className="text-xs text-[var(--muted)]">Cambio</span>
              <div className={`text-3xl font-semibold mt-2 ${diff > 0 ? "text-amber-400" : diff < 0 ? "text-emerald-400" : "text-[var(--foreground)]"}`}>
                {diff > 0 ? "+" : ""}{diff.toFixed(1)} {latest.unit}
              </div>
              <span className="text-xs text-[var(--muted)]">vs registro anterior</span>
            </div>
          )}
          <div className="glass-card p-5">
            <span className="text-xs text-[var(--muted)]">Total registros</span>
            <div className="text-3xl font-semibold mt-2">
              {measurements?.length || 0}
            </div>
            <span className="text-xs text-[var(--muted)]">{selectedMeta.label}</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="glass-card-static p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
            <Scale size={15} className="text-purple-400" />
          </div>
          <h3 className="font-medium">Tendencia - {selectedMeta.label}</h3>
        </div>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
              <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
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
          <div className="flex items-center justify-center h-[280px] text-sm text-[var(--muted)]">
            {isLoading ? "Cargando..." : "Necesitas al menos 2 registros para ver la tendencia"}
          </div>
        )}
      </div>

      {/* History table */}
      {measurements && measurements.length > 0 && (
        <div className="glass-card-static overflow-hidden">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Valor</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {measurements.slice(0, 20).map((m: any) => (
                <tr key={m.id}>
                  <td className="text-[var(--foreground-muted)]">{formatDate(m.recordedAt)}</td>
                  <td className="font-medium">{formatMetricValue(m.value, m.unit)}</td>
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
              <h3 className="font-semibold text-lg">Registrar medida</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-white/[0.04] cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                logMutation.mutate({
                  measurementType: form.measurementType,
                  value: parseFloat(form.value),
                  notes: form.notes || undefined,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1.5">Tipo</label>
                <select
                  value={form.measurementType}
                  onChange={(e) => setForm({ ...form, measurementType: e.target.value })}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                >
                  {measurementTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label} ({t.unit})</option>
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
                  placeholder="Ej: 72.5"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1.5">Notas (opcional)</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  placeholder="Notas..."
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
