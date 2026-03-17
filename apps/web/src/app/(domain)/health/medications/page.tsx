"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { healthApi } from "@/lib/api/health";
import { formatDate, formatDateTime } from "@/lib/format";
import { Plus, X, Pill, Check, SkipForward, Clock } from "lucide-react";

export default function MedicationsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedMed, setSelectedMed] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", dosage: "", frequency: "daily", timeOfDay: "morning", notes: "",
  });

  const { data: medications, isLoading } = useQuery({
    queryKey: ["health", "medications"],
    queryFn: () => healthApi.getMedications(),
  });

  const { data: logs } = useQuery({
    queryKey: ["health", "medication-logs", selectedMed],
    queryFn: () => healthApi.getMedicationLogs(selectedMed!),
    enabled: !!selectedMed,
  });

  const createMutation = useMutation({
    mutationFn: healthApi.createMedication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "medications"] });
      setShowForm(false);
      setForm({ name: "", dosage: "", frequency: "daily", timeOfDay: "morning", notes: "" });
    },
  });

  const logTakenMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => healthApi.logMedication(id, { skipped: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health"] });
    },
  });

  const logSkippedMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => healthApi.logMedication(id, { skipped: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health"] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => healthApi.deleteMedication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "medications"] });
    },
  });

  const timeLabels: Record<string, string> = {
    morning: "Manana",
    afternoon: "Tarde",
    evening: "Noche",
    night: "Antes de dormir",
  };

  const freqLabels: Record<string, string> = {
    daily: "Diario",
    twice_daily: "2x al dia",
    weekly: "Semanal",
    as_needed: "Segun necesidad",
  };

  return (
    <div className="space-y-8 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Medicamentos</h2>
          <p className="text-sm text-[var(--muted)] mt-1">Control de medicamentos y adherencia</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Agregar
        </button>
      </div>

      {/* Medications list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card-static p-5 h-24">
              <div className="skeleton h-4 w-32 mb-3" />
              <div className="skeleton h-3 w-48" />
            </div>
          ))}
        </div>
      ) : medications && medications.length > 0 ? (
        <div className="space-y-4 stagger-children">
          {medications.map((med: any) => (
            <div key={med.id} className="glass-card p-5" style={selectedMed === med.id ? { borderColor: "var(--emerald-soft-border)" } : undefined}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--emerald-soft-bg)" }}>
                    <Pill size={18} style={{ color: "var(--emerald-soft-text)" }} />
                  </div>
                  <div>
                    <h3 className="font-medium">{med.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      {med.dosage && <span className="text-xs text-[var(--foreground-muted)]">{med.dosage}</span>}
                      <span className="badge badge-green text-[10px]">{freqLabels[med.frequency] || med.frequency}</span>
                      {med.timeOfDay && (
                        <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
                          <Clock size={10} />
                          {timeLabels[med.timeOfDay] || med.timeOfDay}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => logTakenMutation.mutate({ id: med.id })}
                    className="p-2 rounded-lg hover:opacity-80 transition-all cursor-pointer"
                    style={{ background: "var(--emerald-soft-bg)", color: "var(--emerald-soft-text)" }}
                    title="Marcar como tomado"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => logSkippedMutation.mutate({ id: med.id })}
                    className="p-2 rounded-lg hover:opacity-80 transition-all cursor-pointer"
                    style={{ background: "var(--amber-soft-bg)", color: "var(--amber-soft-text)" }}
                    title="Marcar como omitido"
                  >
                    <SkipForward size={16} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <button
                  onClick={() => setSelectedMed(selectedMed === med.id ? null : med.id)}
                  className="text-xs text-[var(--muted)] hover:text-[var(--emerald-soft-text)] transition-colors cursor-pointer"
                >
                  {selectedMed === med.id ? "Ocultar historial" : "Ver historial"}
                </button>
                <button
                  onClick={() => deactivateMutation.mutate(med.id)}
                  className="text-xs text-[var(--muted)] hover:text-[var(--red-soft-text)] transition-colors cursor-pointer"
                >
                  Desactivar
                </button>
                {med.notes && <span className="text-xs text-[var(--muted)] ml-auto">{med.notes}</span>}
              </div>

              {/* Logs section */}
              {selectedMed === med.id && logs && (
                <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
                  <h4 className="text-xs text-[var(--muted)] font-medium mb-3">Historial reciente</h4>
                  {logs.length > 0 ? (
                    <div className="space-y-2">
                      {logs.slice(0, 10).map((log: any) => (
                        <div key={log.id} className="flex items-center justify-between text-sm">
                          <span className="text-[var(--foreground-muted)]">{formatDateTime(log.takenAt)}</span>
                          <span className={log.skipped ? "badge badge-red text-[10px]" : "badge badge-green text-[10px]"}>
                            {log.skipped ? "Omitido" : "Tomado"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--muted)]">Sin registros todavia</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card-static p-12 text-center">
          <div className="text-4xl mb-4">💊</div>
          <p className="text-sm text-[var(--muted)]">No hay medicamentos activos</p>
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="glass-card-static p-6 w-full max-w-md mx-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Nuevo medicamento</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--hover-overlay)] cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({
                  name: form.name,
                  dosage: form.dosage || undefined,
                  frequency: form.frequency,
                  timeOfDay: form.timeOfDay || undefined,
                  notes: form.notes || undefined,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1.5">Nombre</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  placeholder="Ej: Ibuprofeno"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1.5">Dosis</label>
                <input
                  value={form.dosage}
                  onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  placeholder="Ej: 400mg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--muted)] block mb-1.5">Frecuencia</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="glass-input w-full px-3 py-2.5 text-sm"
                  >
                    <option value="daily">Diario</option>
                    <option value="twice_daily">2x al dia</option>
                    <option value="weekly">Semanal</option>
                    <option value="as_needed">Segun necesidad</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)] block mb-1.5">Horario</label>
                  <select
                    value={form.timeOfDay}
                    onChange={(e) => setForm({ ...form, timeOfDay: e.target.value })}
                    className="glass-input w-full px-3 py-2.5 text-sm"
                  >
                    <option value="morning">Manana</option>
                    <option value="afternoon">Tarde</option>
                    <option value="evening">Noche</option>
                    <option value="night">Antes de dormir</option>
                  </select>
                </div>
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
              <button type="submit" disabled={createMutation.isPending || !form.name} className="btn-primary w-full justify-center">
                {createMutation.isPending ? "Guardando..." : "Agregar medicamento"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
