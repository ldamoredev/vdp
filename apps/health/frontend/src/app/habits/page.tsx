"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate, getTodayISO } from "@/lib/format";
import { Plus, X, Check, Repeat } from "lucide-react";

export default function HabitsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", frequency: "daily", icon: "", color: "" });

  const { data: habits, isLoading } = useQuery({
    queryKey: ["health", "habits"],
    queryFn: () => api.getHabits(),
  });

  const createMutation = useMutation({
    mutationFn: api.createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "habits"] });
      setShowForm(false);
      setForm({ name: "", description: "", frequency: "daily", icon: "", color: "" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => api.completeHabit(id, { date: getTodayISO() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health", "habits"] });
    },
  });

  const icons = ["💪", "🏃", "📖", "💧", "🧘", "🥗", "😴", "🎯", "✍️", "🧠"];

  return (
    <div className="space-y-8 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Habitos</h2>
          <p className="text-sm text-[var(--muted)] mt-1">Seguimiento diario de tus habitos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Nuevo habito
        </button>
      </div>

      {/* Habits grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card-static p-5 h-32">
              <div className="skeleton h-4 w-24 mb-3" />
              <div className="skeleton h-3 w-40" />
            </div>
          ))}
        </div>
      ) : habits && habits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {habits.map((habit: any) => (
            <div key={habit.id} className="glass-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{habit.icon || "📋"}</div>
                  <div>
                    <h3 className="font-medium">{habit.name}</h3>
                    {habit.description && (
                      <p className="text-xs text-[var(--muted)] mt-0.5">{habit.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => completeMutation.mutate({ id: habit.id })}
                  disabled={completeMutation.isPending}
                  className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-all cursor-pointer"
                  title="Completar hoy"
                >
                  <Check size={18} />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <Repeat size={12} />
                  <span>{habit.frequency === "daily" ? "Diario" : habit.frequency === "weekly" ? "Semanal" : habit.frequency}</span>
                </div>
                {habit.targetValue && (
                  <span className="text-xs text-[var(--muted)]">
                    Meta: {habit.targetValue} {habit.unit || ""}
                  </span>
                )}
                <button
                  onClick={() => deleteMutation.mutate(habit.id)}
                  className="ml-auto text-xs text-[var(--muted)] hover:text-red-400 transition-colors cursor-pointer"
                >
                  Desactivar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card-static p-12 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <p className="text-sm text-[var(--muted)]">No hay habitos todavia. Crea tu primer habito.</p>
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="glass-card-static p-6 w-full max-w-md mx-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Nuevo habito</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-white/[0.04] cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({
                  name: form.name,
                  description: form.description || undefined,
                  frequency: form.frequency,
                  icon: form.icon || undefined,
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
                  placeholder="Ej: Meditar 10 minutos"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1.5">Descripcion (opcional)</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  placeholder="Detalles del habito..."
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1.5">Frecuencia</label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1.5">Icono</label>
                <div className="flex flex-wrap gap-2">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all cursor-pointer ${
                        form.icon === icon
                          ? "bg-emerald-500/20 border border-emerald-500/40"
                          : "bg-white/[0.04] hover:bg-white/[0.08]"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={createMutation.isPending || !form.name} className="btn-primary w-full justify-center">
                {createMutation.isPending ? "Creando..." : "Crear habito"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
