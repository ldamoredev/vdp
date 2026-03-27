"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar, Check, Plus, Target } from "lucide-react";
import { walletApi } from "@/lib/api/wallet";
import type { SavingsGoal } from "@/lib/api/types";
import { formatDate, formatMoney, getTodayISO } from "@/lib/format";

type SavingsFormState = {
  name: string;
  targetAmount: string;
  currency: "ARS" | "USD";
  deadline: string;
};

export default function SavingsPage() {
  const queryClient = useQueryClient();
  const { data: goals = [] } = useQuery<SavingsGoal[]>({
    queryKey: ["wallet", "savings"],
    queryFn: walletApi.getSavings,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SavingsFormState>({
    name: "",
    targetAmount: "",
    currency: "ARS",
    deadline: "",
  });
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");

  const createMutation = useMutation({
    mutationFn: walletApi.createSavingsGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "savings"] });
      setShowForm(false);
      setForm({ name: "", targetAmount: "", currency: "ARS", deadline: "" });
    },
  });

  const contributeMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: string }) =>
      walletApi.contributeSavings(id, {
        amount,
        date: getTodayISO(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "savings"] });
      setContributeId(null);
      setContributeAmount("");
    },
  });

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Ahorros</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Metas de ahorro, progreso y aportes
          </p>
        </div>
        <button
          onClick={() => setShowForm((current) => !current)}
          className="btn-primary cursor-pointer"
        >
          <Plus size={16} />
          Nueva meta
        </button>
      </div>

      {showForm && (
        <div className="glass-card-static p-5 animate-fade-in-up">
          <h3 className="text-sm font-semibold mb-4">Crear meta de ahorro</h3>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate({
                ...form,
                deadline: form.deadline || null,
              });
            }}
          >
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ej: Fondo de emergencia"
              className="glass-input w-full px-4 py-2.5 text-sm"
              required
            />

            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                value={form.targetAmount}
                onChange={(event) => setForm((current) => ({ ...current, targetAmount: event.target.value }))}
                placeholder="Monto objetivo"
                className="glass-input flex-1 px-4 py-2.5 text-sm"
                required
              />
              <select
                value={form.currency}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    currency: event.target.value as "ARS" | "USD",
                  }))
                }
                className="glass-input px-4 py-2.5 text-sm cursor-pointer"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <input
              type="date"
              value={form.deadline}
              onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
              className="glass-input w-full px-4 py-2.5 text-sm"
            />

            <div className="flex gap-2">
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

      {goals.length === 0 ? (
        <div className="glass-card-static p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--hover-overlay)] flex items-center justify-center mx-auto mb-4">
            <Target size={24} className="text-[var(--muted)]" />
          </div>
          <p className="text-[var(--muted)] text-sm">No hay metas de ahorro aun</p>
          <p className="text-[var(--muted)] text-xs mt-1">Crea una meta para empezar a seguir progreso real</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {goals.map((goal) => {
            const current = parseFloat(goal.currentAmount);
            const target = parseFloat(goal.targetAmount);
            const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;

            return (
              <div key={goal.id} className={`glass-card p-5 ${goal.isCompleted ? "glow-green" : ""}`}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-glow)] flex items-center justify-center">
                      {goal.isCompleted ? (
                        <Check size={18} className="text-[var(--accent-green)]" />
                      ) : (
                        <Target size={18} className="text-[var(--accent)]" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{goal.name}</h3>
                      {goal.deadline ? (
                        <p className="text-xs text-[var(--muted)] flex items-center gap-1.5 mt-1">
                          <Calendar size={12} />
                          {formatDate(goal.deadline)}
                        </p>
                      ) : (
                        <p className="text-xs text-[var(--muted)] mt-1">Sin fecha limite</p>
                      )}
                    </div>
                  </div>
                  {goal.isCompleted && <span className="badge badge-green">Completado</span>}
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-lg font-semibold">
                      {formatMoney(current, goal.currency as "ARS" | "USD")}
                    </span>
                    <span className="text-sm text-[var(--muted)]">
                      de {formatMoney(target, goal.currency as "ARS" | "USD")}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-[var(--muted)]">
                    <span className="font-semibold text-[var(--foreground)]">{progress.toFixed(0)}%</span> acumulado
                  </div>
                  {contributeId === goal.id ? (
                    <form
                      className="flex items-center gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        contributeMutation.mutate({ id: goal.id, amount: contributeAmount });
                      }}
                    >
                      <input
                        type="number"
                        step="0.01"
                        value={contributeAmount}
                        onChange={(event) => setContributeAmount(event.target.value)}
                        placeholder="Monto"
                        className="glass-input w-28 px-3 py-2 text-sm"
                        required
                      />
                      <button type="submit" className="btn-primary px-3 py-2 text-sm">
                        Aportar
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setContributeId(goal.id)}
                      className="btn-secondary cursor-pointer"
                    >
                      Aportar
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
