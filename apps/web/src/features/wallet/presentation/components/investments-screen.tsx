"use client";

import { useState } from "react";
import { Briefcase, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { ModulePage } from "@/components/primitives/module-page";
import { StateCard } from "@/components/primitives/state-card";
import { formatMoney } from "@/lib/format";
import { useWalletActions, useWalletData } from "../use-wallet-context";
import { investmentTypeLabels } from "../wallet-selectors";
import {
  buildWalletEmptyState,
  buildWalletScreenIntro,
} from "../wallet-polish-selectors";
import { WalletEmptyState } from "./wallet-empty-state";

export function InvestmentsScreen() {
  const {
    investments,
    accounts,
    investmentSummary,
    showInvestmentForm,
    investmentForm,
    isLoadingInvestments,
    isCreatingInvestment,
    isUpdatingInvestment,
  } = useWalletData();
  const {
    toggleInvestmentForm,
    setInvestmentFormField,
    submitInvestment,
    updateInvestment,
  } = useWalletActions();
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(
    null,
  );
  const [editingCurrentValue, setEditingCurrentValue] = useState("");
  const [editingRate, setEditingRate] = useState("");
  const [editingNotes, setEditingNotes] = useState("");

  function startEditing(investment: (typeof investments)[number]) {
    setEditingInvestmentId(investment.id);
    setEditingCurrentValue(investment.currentValue);
    setEditingRate(investment.rate ?? "");
    setEditingNotes(investment.notes ?? "");
  }

  function stopEditing() {
    setEditingInvestmentId(null);
    setEditingCurrentValue("");
    setEditingRate("");
    setEditingNotes("");
  }

  return (
    <ModulePage width="5xl" spacing="6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Inversiones</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {buildWalletScreenIntro("investments")}
          </p>
        </div>
        <button onClick={toggleInvestmentForm} className="btn-primary">
          <Plus size={16} />
          Nueva inversion
        </button>
      </div>

      {investments.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 stagger-children">
          <div className="glass-card-static p-5">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              Total invertido
            </span>
            <div className="mt-2 text-xl font-bold tracking-tight">
              {formatMoney(investmentSummary.totalInvested, "ARS")}
            </div>
          </div>
          <div className="glass-card-static p-5">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              Valor actual
            </span>
            <div className="mt-2 text-xl font-bold tracking-tight">
              {formatMoney(investmentSummary.totalCurrent, "ARS")}
            </div>
          </div>
          <div
            className={`glass-card-static p-5 ${
              investmentSummary.positive ? "glow-green" : "glow-red"
            }`}
          >
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              Retorno total
            </span>
            <div
              className={`mt-2 flex items-center gap-2 text-xl font-bold tracking-tight ${
                investmentSummary.positive
                  ? "text-[var(--accent-green)]"
                  : "text-[var(--accent-red)]"
              }`}
            >
              {investmentSummary.positive ? (
                <TrendingUp size={20} />
              ) : (
                <TrendingDown size={20} />
              )}
              {investmentSummary.totalReturn}%
            </div>
          </div>
        </div>
      )}

      {showInvestmentForm && (
        <div className="glass-card-static animate-fade-in-up p-5">
          <h3 className="mb-4 text-sm font-semibold">Nueva inversion</h3>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void submitInvestment();
            }}
          >
            <input
              value={investmentForm.name}
              onChange={(event) =>
                setInvestmentFormField("name", event.target.value)
              }
              placeholder="Ej: FCI liquidez"
              className="glass-input w-full px-4 py-2.5 text-sm"
              required
            />

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <select
                value={investmentForm.type}
                onChange={(event) =>
                  setInvestmentFormField("type", event.target.value)
                }
                className="glass-input px-4 py-2.5 text-sm"
              >
                {Object.entries(investmentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={investmentForm.accountId}
                onChange={(event) =>
                  setInvestmentFormField("accountId", event.target.value)
                }
                className="glass-input px-4 py-2.5 text-sm"
              >
                <option value="">Sin cuenta asociada</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>

              <select
                value={investmentForm.currency}
                onChange={(event) =>
                  setInvestmentFormField("currency", event.target.value)
                }
                className="glass-input px-4 py-2.5 text-sm"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input
                type="number"
                step="0.01"
                value={investmentForm.investedAmount}
                onChange={(event) =>
                  setInvestmentFormField("investedAmount", event.target.value)
                }
                placeholder="Monto invertido"
                className="glass-input px-4 py-2.5 text-sm"
                required
              />
              <input
                type="number"
                step="0.01"
                value={investmentForm.currentValue}
                onChange={(event) =>
                  setInvestmentFormField("currentValue", event.target.value)
                }
                placeholder="Valor actual"
                className="glass-input px-4 py-2.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <input
                type="date"
                value={investmentForm.startDate}
                onChange={(event) =>
                  setInvestmentFormField("startDate", event.target.value)
                }
                className="glass-input px-4 py-2.5 text-sm"
                required
              />
              <input
                type="date"
                value={investmentForm.endDate}
                onChange={(event) =>
                  setInvestmentFormField("endDate", event.target.value)
                }
                className="glass-input px-4 py-2.5 text-sm"
              />
              <input
                type="number"
                step="0.0001"
                value={investmentForm.rate}
                onChange={(event) =>
                  setInvestmentFormField("rate", event.target.value)
                }
                placeholder="Tasa"
                className="glass-input px-4 py-2.5 text-sm"
              />
            </div>

            <textarea
              value={investmentForm.notes}
              onChange={(event) =>
                setInvestmentFormField("notes", event.target.value)
              }
              placeholder="Notas opcionales"
              className="glass-input min-h-24 w-full px-4 py-2.5 text-sm"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="btn-primary"
                disabled={isCreatingInvestment}
              >
                {isCreatingInvestment ? "Creando..." : "Crear"}
              </button>
              <button
                type="button"
                onClick={toggleInvestmentForm}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoadingInvestments ? (
        <StateCard
          size="lg"
          className="glass-card-static border-none"
          description="Cargando inversiones..."
        />
      ) : investments.length === 0 ? (
        <div className="glass-card-static border-none">
          <WalletEmptyState {...buildWalletEmptyState("investments")} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 stagger-children">
          {investments.map((investment) => {
            const invested = Number(investment.investedAmount);
            const current = Number(investment.currentValue);
            const returnPct =
              invested > 0
                ? (((current - invested) / invested) * 100).toFixed(1)
                : "0.0";
            const positive = current >= invested;
            const isEditing = editingInvestmentId === investment.id;

            return (
              <div key={investment.id} className="glass-card p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{investment.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {investmentTypeLabels[investment.type] ?? investment.type}
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      positive ? "badge-green" : "badge-red"
                    }`}
                  >
                    {positive ? "+" : ""}
                    {returnPct}%
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted)]">Invertido</span>
                    <span className="font-medium">
                      {formatMoney(
                        invested,
                        investment.currency as "ARS" | "USD",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted)]">Actual</span>
                    <span className="font-medium">
                      {formatMoney(
                        current,
                        investment.currency as "ARS" | "USD",
                      )}
                    </span>
                  </div>
                </div>

                {isEditing ? (
                  <form
                    className="mt-4 space-y-3 border-t border-[var(--glass-border)] pt-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void updateInvestment({
                        id: investment.id,
                        data: {
                          currentValue: editingCurrentValue,
                          rate: editingRate || null,
                          notes: editingNotes || null,
                        },
                      }).then(() => {
                        stopEditing();
                      });
                    }}
                  >
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                          Valor actual
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingCurrentValue}
                          onChange={(event) =>
                            setEditingCurrentValue(event.target.value)
                          }
                          className="glass-input w-full px-3 py-2 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                          Tasa
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={editingRate}
                          onChange={(event) => setEditingRate(event.target.value)}
                          placeholder="Opcional"
                          className="glass-input w-full px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                        Notas
                      </label>
                      <textarea
                        value={editingNotes}
                        onChange={(event) => setEditingNotes(event.target.value)}
                        placeholder="Notas opcionales sobre la valuacion"
                        className="glass-input min-h-24 w-full px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="btn-primary px-3 py-1.5 text-xs"
                        disabled={isUpdatingInvestment}
                      >
                        {isUpdatingInvestment ? "Guardando..." : "Guardar cambios"}
                      </button>
                      <button
                        type="button"
                        onClick={stopEditing}
                        className="btn-secondary px-3 py-1.5 text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {investment.notes && (
                      <p className="mt-4 border-t border-[var(--glass-border)] pt-4 text-xs text-[var(--muted)]">
                        {investment.notes}
                      </p>
                    )}

                    <div className="mt-4 flex gap-2 border-t border-[var(--glass-border)] pt-4">
                      <button
                        onClick={() => startEditing(investment)}
                        className="btn-secondary px-3 py-1.5 text-xs"
                        disabled={isUpdatingInvestment}
                      >
                        Editar valuacion
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ModulePage>
  );
}
