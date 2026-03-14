"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useState } from "react";
import { Plus, Target, Check, Calendar } from "lucide-react";

export default function SavingsPage() {
  const queryClient = useQueryClient();
  const { data: goals = [] } = useQuery({
    queryKey: ["savings"],
    queryFn: api.getSavings,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    currency: "ARS",
    deadline: "",
  });

  const createMutation = useMutation({
    mutationFn: api.createSavingsGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings"] });
      setShowForm(false);
      setForm({ name: "", targetAmount: "", currency: "ARS", deadline: "" });
    },
  });

  const [contributeId, setContributeId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");

  const contributeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.contributeSavings(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings"] });
      setContributeId(null);
      setContributeAmount("");
    },
  });

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Ahorros</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Metas de ahorro y progreso
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary cursor-pointer"
        >
          <Plus size={16} />
          Nueva meta
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="glass-card-static p-5 animate-fade-in-up">
          <h3 className="text-sm font-semibold mb-4">Crear meta de ahorro</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate({
                ...form,
                deadline: form.deadline || null,
              });
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5">
                Nombre
              </label>
              <input
                placeholder="Ej: Vacaciones de verano"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="glass-input w-full px-4 py-2.5 text-sm"
                required
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5">
                  Monto objetivo
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.targetAmount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, targetAmount: e.target.value }))
                  }
                  className="glass-input w-full px-4 py-2.5 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5">
                  Moneda
                </label>
                <select
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currency: e.target.value }))
                  }
                  className="glass-input px-4 py-2.5 text-sm cursor-pointer"
                >
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5">
                Fecha limite (opcional)
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deadline: e.target.value }))
                }
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary cursor-pointer">
                Crear meta
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals grid */}
      {goals.length === 0 ? (
        <div className="glass-card-static p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
            <Target size={24} className="text-[var(--muted)]" />
          </div>
          <p className="text-[var(--muted)] text-sm">
            No hay metas de ahorro aun
          </p>
          <p className="text-[var(--muted)] text-xs mt-1">
            Crea tu primera meta para empezar a ahorrar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {goals.map((goal: any) => {
            const current = parseFloat(goal.currentAmount);
            const target = parseFloat(goal.targetAmount);
            const pct =
              target > 0 ? Math.min((current / target) * 100, 100) : 0;
            const isCompleted = pct >= 100;

            return (
              <div
                key={goal.id}
                className={`glass-card p-5 cursor-pointer ${
                  isCompleted ? "glow-green" : ""
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isCompleted
                          ? "bg-[var(--accent-green-glow)]"
                          : "bg-[var(--accent-glow)]"
                      }`}
                    >
                      {isCompleted ? (
                        <Check
                          size={18}
                          className="text-[var(--accent-green)]"
                        />
                      ) : (
                        <Target size={18} className="text-[var(--accent)]" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-sm">{goal.name}</span>
                      {goal.isCompleted && (
                        <span className="badge badge-green ml-2">
                          Completado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-lg font-semibold">
                      {formatMoney(current, goal.currency)}
                    </span>
                    <span className="text-sm text-[var(--muted)]">
                      de {formatMoney(target, goal.currency)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="progress-bar">
                    <div
                      className={`progress-bar-fill ${isCompleted ? "green" : ""}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                    <span className="font-semibold text-[var(--foreground)]">
                      {pct.toFixed(0)}%
                    </span>
                    {goal.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {goal.deadline}
                      </span>
                    )}
                  </div>

                  {contributeId === goal.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        contributeMutation.mutate({
                          id: goal.id,
                          data: {
                            goalId: goal.id,
                            amount: contributeAmount,
                            date: new Date().toISOString().slice(0, 10),
                          },
                        });
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Monto"
                        value={contributeAmount}
                        onChange={(e) => setContributeAmount(e.target.value)}
                        className="glass-input w-24 px-2 py-1 text-xs"
                        required
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-lg bg-[var(--accent)] text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        OK
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setContributeId(goal.id)}
                      className="text-xs font-medium text-[var(--accent)] hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      + Contribuir
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
