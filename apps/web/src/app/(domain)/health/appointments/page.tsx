"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { healthApi } from "@/lib/api/health";
import { formatDateTime, formatRelative } from "@/lib/format";
import { Plus, X, CalendarClock, MapPin, User, Clock } from "lucide-react";

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [form, setForm] = useState({
    title: "", doctorName: "", specialty: "", location: "",
    scheduledAt: "", durationMinutes: "", notes: "",
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["health", "appointments", statusFilter],
    queryFn: () => healthApi.getAppointments(statusFilter || undefined),
  });

  const createMutation = useMutation({
    mutationFn: healthApi.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "appointments"] });
      setShowForm(false);
      setForm({ title: "", doctorName: "", specialty: "", location: "", scheduledAt: "", durationMinutes: "", notes: "" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      healthApi.updateAppointment(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "appointments"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: healthApi.deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "appointments"] });
    },
  });

  const statusColors: Record<string, string> = {
    upcoming: "badge-blue",
    completed: "badge-green",
    cancelled: "badge-red",
  };

  const statusLabels: Record<string, string> = {
    upcoming: "Programada",
    completed: "Completada",
    cancelled: "Cancelada",
  };

  return (
    <div className="space-y-8 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Citas medicas</h2>
          <p className="text-sm text-[var(--muted)] mt-1">Calendario de consultas y turnos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Nueva cita
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {[
          { value: "", label: "Todas" },
          { value: "upcoming", label: "Programadas" },
          { value: "completed", label: "Completadas" },
          { value: "cancelled", label: "Canceladas" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              statusFilter === f.value
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "glass-card text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Appointments list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card-static p-5 h-28">
              <div className="skeleton h-4 w-40 mb-3" />
              <div className="skeleton h-3 w-56" />
            </div>
          ))}
        </div>
      ) : appointments && appointments.length > 0 ? (
        <div className="space-y-4 stagger-children">
          {appointments.map((apt: any) => (
            <div key={apt.id} className="glass-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mt-0.5">
                    <CalendarClock size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{apt.title}</h3>
                      <span className={`badge ${statusColors[apt.status] || "badge-muted"} text-[10px]`}>
                        {statusLabels[apt.status] || apt.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {apt.doctorName && (
                        <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                          <User size={11} /> {apt.doctorName}
                        </span>
                      )}
                      {apt.specialty && (
                        <span className="text-xs text-[var(--muted)]">{apt.specialty}</span>
                      )}
                      {apt.location && (
                        <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
                          <MapPin size={11} /> {apt.location}
                        </span>
                      )}
                      {apt.durationMinutes && (
                        <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
                          <Clock size={11} /> {apt.durationMinutes} min
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-[var(--foreground-muted)]">
                      {formatDateTime(apt.scheduledAt)} ({formatRelative(apt.scheduledAt)})
                    </div>
                    {apt.notes && (
                      <p className="text-xs text-[var(--muted)] mt-2">{apt.notes}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 pl-14">
                {apt.status === "upcoming" && (
                  <>
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: apt.id, status: "completed" })}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      Marcar completada
                    </button>
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: apt.id, status: "cancelled" })}
                      className="text-xs text-[var(--muted)] hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </>
                )}
                <button
                  onClick={() => deleteMutation.mutate(apt.id)}
                  className="text-xs text-[var(--muted)] hover:text-red-400 transition-colors cursor-pointer ml-auto"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card-static p-12 text-center">
          <div className="text-4xl mb-4">📅</div>
          <p className="text-sm text-[var(--muted)]">No hay citas registradas</p>
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="glass-card-static p-6 w-full max-w-md mx-4 animate-fade-in-up max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Nueva cita</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-white/[0.04] cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({
                  title: form.title,
                  doctorName: form.doctorName || undefined,
                  specialty: form.specialty || undefined,
                  location: form.location || undefined,
                  scheduledAt: form.scheduledAt,
                  durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : undefined,
                  notes: form.notes || undefined,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1.5">Titulo</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  placeholder="Ej: Control anual"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1.5">Fecha y hora</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--muted)] block mb-1.5">Doctor/a</label>
                  <input
                    value={form.doctorName}
                    onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                    className="glass-input w-full px-3 py-2.5 text-sm"
                    placeholder="Dr. Garcia"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)] block mb-1.5">Especialidad</label>
                  <input
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    className="glass-input w-full px-3 py-2.5 text-sm"
                    placeholder="Clinico"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--muted)] block mb-1.5">Lugar</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="glass-input w-full px-3 py-2.5 text-sm"
                    placeholder="Consultorio..."
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)] block mb-1.5">Duracion (min)</label>
                  <input
                    type="number"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                    className="glass-input w-full px-3 py-2.5 text-sm"
                    placeholder="30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1.5">Notas</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  placeholder="Llevar estudios previos..."
                />
              </div>
              <button type="submit" disabled={createMutation.isPending || !form.title || !form.scheduledAt} className="btn-primary w-full justify-center">
                {createMutation.isPending ? "Guardando..." : "Crear cita"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
