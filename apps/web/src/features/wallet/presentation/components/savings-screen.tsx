"use client";

import { Calendar, Check, Plus, Target } from "lucide-react";
import { ModulePage } from "@/components/primitives/module-page";
import { StateCard } from "@/components/primitives/state-card";
import { formatDate, formatMoney } from "@/lib/format";
import { useWalletActions, useWalletData } from "../use-wallet-context";
import { calculateSavingsProgress } from "../wallet-selectors";

export function SavingsScreen() {
  const {
    savingsGoals,
    showSavingsForm,
    savingsForm,
    contributeId,
    contributeAmount,
    isLoadingSavingsGoals,
    isCreatingSavingsGoal,
    isContributingSavings,
  } = useWalletData();
  const {
    toggleSavingsForm,
    setSavingsFormField,
    submitSavingsGoal,
    startContribution,
    cancelContribution,
    setContributeAmount,
    submitContribution,
  } = useWalletActions();

  return (
    <ModulePage width="4xl" spacing="6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Ahorros</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Metas de ahorro, progreso y aportes
          </p>
        </div>
        <button onClick={toggleSavingsForm} className="btn-primary">
          <Plus size={16} />
          Nueva meta
        </button>
      </div>

      {showSavingsForm && (
        <div className="glass-card-static animate-fade-in-up p-5">
          <h3 className="mb-4 text-sm font-semibold">Crear meta de ahorro</h3>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void submitSavingsGoal();
            }}
          >
            <input
              value={savingsForm.name}
              onChange={(event) =>
                setSavingsFormField("name", event.target.value)
              }
              placeholder="Ej: Fondo de emergencia"
              className="glass-input w-full px-4 py-2.5 text-sm"
              required
            />

            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                value={savingsForm.targetAmount}
                onChange={(event) =>
                  setSavingsFormField("targetAmount", event.target.value)
                }
                placeholder="Monto objetivo"
                className="glass-input flex-1 px-4 py-2.5 text-sm"
                required
              />
              <select
                value={savingsForm.currency}
                onChange={(event) =>
                  setSavingsFormField("currency", event.target.value)
                }
                className="glass-input px-4 py-2.5 text-sm"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <input
              type="date"
              value={savingsForm.deadline}
              onChange={(event) =>
                setSavingsFormField("deadline", event.target.value)
              }
              className="glass-input w-full px-4 py-2.5 text-sm"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="btn-primary"
                disabled={isCreatingSavingsGoal}
              >
                {isCreatingSavingsGoal ? "Creando..." : "Crear meta"}
              </button>
              <button
                type="button"
                onClick={toggleSavingsForm}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoadingSavingsGoals ? (
        <StateCard
          size="lg"
          className="glass-card-static border-none"
          description="Cargando metas..."
        />
      ) : savingsGoals.length === 0 ? (
        <StateCard
          size="lg"
          className="glass-card-static border-none"
          icon={
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--hover-overlay)]">
              <Target size={24} className="text-[var(--muted)]" />
            </div>
          }
          title="No hay metas de ahorro aun"
          description="Crea una meta para empezar a seguir progreso real"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 stagger-children">
          {savingsGoals.map((goal) => {
            const { current, target, progress } =
              calculateSavingsProgress(goal);

            return (
              <div
                key={goal.id}
                className={`glass-card p-5 ${
                  goal.isCompleted ? "glow-green" : ""
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-glow)]">
                      {goal.isCompleted ? (
                        <Check
                          size={18}
                          className="text-[var(--accent-green)]"
                        />
                      ) : (
                        <Target size={18} className="text-[var(--accent)]" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{goal.name}</h3>
                      {goal.deadline ? (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                          <Calendar size={12} />
                          {formatDate(goal.deadline)}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Sin fecha limite
                        </p>
                      )}
                    </div>
                  </div>
                  {goal.isCompleted && (
                    <span className="badge badge-green">Completado</span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-lg font-semibold">
                      {formatMoney(current, goal.currency as "ARS" | "USD")}
                    </span>
                    <span className="text-sm text-[var(--muted)]">
                      de {formatMoney(target, goal.currency as "ARS" | "USD")}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-[var(--muted)]">
                    <span className="font-semibold text-[var(--foreground)]">
                      {progress.toFixed(0)}%
                    </span>{" "}
                    acumulado
                  </div>

                  {contributeId === goal.id ? (
                    <form
                      className="flex items-center gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void submitContribution();
                      }}
                    >
                      <input
                        type="number"
                        step="0.01"
                        value={contributeAmount}
                        onChange={(event) =>
                          setContributeAmount(event.target.value)
                        }
                        placeholder="Monto"
                        className="glass-input w-28 px-3 py-2 text-sm"
                        required
                      />
                      <button
                        type="submit"
                        className="btn-primary px-3 py-2 text-sm"
                        disabled={isContributingSavings}
                      >
                        {isContributingSavings ? "..." : "Aportar"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelContribution}
                        className="btn-secondary px-3 py-2 text-sm"
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => startContribution(goal.id)}
                      className="btn-secondary"
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
    </ModulePage>
  );
}
