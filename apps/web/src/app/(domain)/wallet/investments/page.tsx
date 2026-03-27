"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Briefcase, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { walletApi } from "@/lib/api/wallet";
import type { Account, Investment } from "@/lib/api/types";
import { formatMoney, getTodayISO } from "@/lib/format";

const typeLabels: Record<string, string> = {
  plazo_fijo: "Plazo fijo",
  fci: "FCI",
  cedear: "CEDEAR",
  crypto: "Crypto",
  bond: "Bono",
  other: "Otro",
};

type InvestmentFormState = {
  name: string;
  type: string;
  accountId: string;
  currency: "ARS" | "USD";
  investedAmount: string;
  currentValue: string;
  startDate: string;
  endDate: string;
  rate: string;
  notes: string;
};

export default function InvestmentsPage() {
  const queryClient = useQueryClient();
  const { data: investments = [] } = useQuery<Investment[]>({
    queryKey: ["wallet", "investments"],
    queryFn: walletApi.getInvestments,
  });
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["wallet", "accounts"],
    queryFn: walletApi.getAccounts,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<InvestmentFormState>({
    name: "",
    type: "plazo_fijo",
    accountId: "",
    currency: "ARS",
    investedAmount: "",
    currentValue: "",
    startDate: getTodayISO(),
    endDate: "",
    rate: "",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: walletApi.createInvestment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "investments"] });
      setShowForm(false);
      setForm({
        name: "",
        type: "plazo_fijo",
        accountId: "",
        currency: "ARS",
        investedAmount: "",
        currentValue: "",
        startDate: getTodayISO(),
        endDate: "",
        rate: "",
        notes: "",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, currentValue }: { id: string; currentValue: string }) =>
      walletApi.updateInvestment(id, { currentValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "investments"] });
    },
  });

  const totalInvested = investments.reduce((sum, item) => sum + parseFloat(item.investedAmount), 0);
  const totalCurrent = investments.reduce((sum, item) => sum + parseFloat(item.currentValue), 0);
  const totalReturn =
    totalInvested > 0 ? (((totalCurrent - totalInvested) / totalInvested) * 100).toFixed(1) : "0.0";
  const positive = totalCurrent >= totalInvested;

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Inversiones</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Portafolio actual, rendimiento y actualizacion manual
          </p>
        </div>
        <button onClick={() => setShowForm((current) => !current)} className="btn-primary cursor-pointer">
          <Plus size={16} />
          Nueva
        </button>
      </div>

      {investments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
          <div className="glass-card-static p-5">
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
              Total invertido
            </span>
            <div className="text-xl font-semibold mt-2">{formatMoney(totalInvested, "ARS")}</div>
          </div>
          <div className="glass-card-static p-5">
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
              Valor actual
            </span>
            <div className="text-xl font-semibold mt-2">{formatMoney(totalCurrent, "ARS")}</div>
          </div>
          <div className={`glass-card-static p-5 ${positive ? "glow-green" : "glow-red"}`}>
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
              Retorno total
            </span>
            <div
              className={`flex items-center gap-2 mt-2 text-xl font-semibold ${
                positive ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"
              }`}
            >
              {positive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              {totalReturn}%
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="glass-card-static p-5 animate-fade-in-up">
          <h3 className="text-sm font-semibold mb-4">Nueva inversion</h3>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate({
                name: form.name,
                type: form.type,
                accountId: form.accountId || null,
                currency: form.currency,
                investedAmount: form.investedAmount,
                currentValue: form.currentValue || form.investedAmount,
                startDate: form.startDate,
                endDate: form.endDate || null,
                rate: form.rate || null,
                notes: form.notes || null,
              });
            }}
          >
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ej: FCI liquidez"
              className="glass-input w-full px-4 py-2.5 text-sm"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                className="glass-input px-4 py-2.5 text-sm cursor-pointer"
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={form.accountId}
                onChange={(event) => setForm((current) => ({ ...current, accountId: event.target.value }))}
                className="glass-input px-4 py-2.5 text-sm cursor-pointer"
              >
                <option value="">Sin cuenta asociada</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                value={form.investedAmount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, investedAmount: event.target.value }))
                }
                placeholder="Monto invertido"
                className="glass-input px-4 py-2.5 text-sm"
                required
              />
              <input
                type="number"
                step="0.01"
                value={form.currentValue}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currentValue: event.target.value }))
                }
                placeholder="Valor actual"
                className="glass-input px-4 py-2.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                className="glass-input px-4 py-2.5 text-sm"
                required
              />
              <input
                type="date"
                value={form.endDate}
                onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                className="glass-input px-4 py-2.5 text-sm"
              />
              <input
                type="number"
                step="0.0001"
                value={form.rate}
                onChange={(event) => setForm((current) => ({ ...current, rate: event.target.value }))}
                placeholder="Tasa"
                className="glass-input px-4 py-2.5 text-sm"
              />
            </div>

            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Notas opcionales"
              className="glass-input w-full min-h-24 px-4 py-2.5 text-sm"
            />

            <div className="flex gap-2">
              <button type="submit" className="btn-primary cursor-pointer">
                Crear
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary cursor-pointer">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {investments.length === 0 ? (
        <div className="glass-card-static p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--hover-overlay)] flex items-center justify-center mx-auto mb-4">
            <Briefcase size={24} className="text-[var(--muted)]" />
          </div>
          <p className="text-[var(--muted)] text-sm">No hay inversiones aun</p>
          <p className="text-[var(--muted)] text-xs mt-1">Registra posiciones para seguir su rendimiento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {investments.map((investment) => {
            const invested = parseFloat(investment.investedAmount);
            const current = parseFloat(investment.currentValue);
            const returnPct = invested > 0 ? (((current - invested) / invested) * 100).toFixed(1) : "0.0";
            const currentPositive = current >= invested;

            return (
              <div key={investment.id} className="glass-card p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-medium">{investment.name}</h3>
                    <p className="text-sm text-[var(--muted)] mt-1">
                      {typeLabels[investment.type] ?? investment.type}
                    </p>
                  </div>
                  <span className={`badge ${currentPositive ? "badge-green" : "badge-red"}`}>
                    {currentPositive ? "+" : ""}
                    {returnPct}%
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted)]">Invertido</span>
                    <span className="font-medium">
                      {formatMoney(invested, investment.currency as "ARS" | "USD")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted)]">Actual</span>
                    <span className="font-medium">
                      {formatMoney(current, investment.currency as "ARS" | "USD")}
                    </span>
                  </div>
                </div>

                {investment.notes && (
                  <p className="text-xs text-[var(--muted)] mt-4 pt-4 border-t border-[var(--glass-border)]">
                    {investment.notes}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-[var(--glass-border)] flex gap-2">
                  <button
                    onClick={() => {
                      const nextValue = prompt("Nuevo valor actual:", investment.currentValue);
                      if (!nextValue) return;
                      updateMutation.mutate({ id: investment.id, currentValue: nextValue });
                    }}
                    className="btn-secondary text-xs px-3 py-1.5 cursor-pointer"
                  >
                    Actualizar valor
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
