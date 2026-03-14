"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, Briefcase } from "lucide-react";

const typeLabels: Record<string, string> = {
  plazo_fijo: "Plazo Fijo",
  fci: "FCI",
  cedear: "CEDEAR",
  crypto: "Crypto",
  bond: "Bono",
  other: "Otro",
};

export default function InvestmentsPage() {
  const queryClient = useQueryClient();
  const { data: investments = [] } = useQuery({
    queryKey: ["investments"],
    queryFn: api.getInvestments,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "plazo_fijo",
    currency: "ARS",
    investedAmount: "",
    currentValue: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    rate: "",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: api.createInvestment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateInvestment(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["investments"] }),
  });

  // Calculate totals
  const totalInvested = investments.reduce(
    (sum: number, inv: any) => sum + parseFloat(inv.investedAmount),
    0
  );
  const totalCurrent = investments.reduce(
    (sum: number, inv: any) => sum + parseFloat(inv.currentValue),
    0
  );
  const totalReturn =
    totalInvested > 0
      ? (((totalCurrent - totalInvested) / totalInvested) * 100).toFixed(1)
      : "0.0";
  const totalIsPositive = totalCurrent >= totalInvested;

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Inversiones
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Tu portafolio de inversiones
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary cursor-pointer"
        >
          <Plus size={16} />
          Nueva
        </button>
      </div>

      {/* Summary cards */}
      {investments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
          <div className="glass-card-static p-5">
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
              Total invertido
            </span>
            <div className="text-xl font-semibold mt-2">
              {formatMoney(totalInvested, "ARS")}
            </div>
          </div>
          <div className="glass-card-static p-5">
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
              Valor actual
            </span>
            <div className="text-xl font-semibold mt-2">
              {formatMoney(totalCurrent, "ARS")}
            </div>
          </div>
          <div
            className={`glass-card-static p-5 ${
              totalIsPositive ? "glow-green" : "glow-red"
            }`}
          >
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
              Retorno total
            </span>
            <div
              className={`flex items-center gap-2 mt-2 text-xl font-semibold ${
                totalIsPositive
                  ? "text-[var(--accent-green)]"
                  : "text-[var(--accent-red)]"
              }`}
            >
              {totalIsPositive ? (
                <TrendingUp size={20} />
              ) : (
                <TrendingDown size={20} />
              )}
              {totalReturn}%
            </div>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="glass-card-static p-5 animate-fade-in-up">
          <h3 className="text-sm font-semibold mb-4">Nueva inversion</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate({
                ...form,
                currentValue: form.currentValue || form.investedAmount,
                endDate: form.endDate || null,
                rate: form.rate || null,
                notes: form.notes || null,
              });
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5">
                Nombre
              </label>
              <input
                placeholder="Ej: Plazo fijo Banco Nacion"
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
                  Tipo
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                  className="glass-input w-full px-4 py-2.5 text-sm cursor-pointer"
                >
                  <option value="plazo_fijo">Plazo Fijo</option>
                  <option value="fci">FCI</option>
                  <option value="cedear">CEDEAR</option>
                  <option value="crypto">Crypto</option>
                  <option value="bond">Bono</option>
                  <option value="other">Otro</option>
                </select>
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
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5">
                  Monto invertido
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.investedAmount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, investedAmount: e.target.value }))
                  }
                  className="glass-input w-full px-4 py-2.5 text-sm"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5">
                  Valor actual
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.currentValue}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currentValue: e.target.value }))
                  }
                  className="glass-input w-full px-4 py-2.5 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary cursor-pointer">
                Crear
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

      {/* Table */}
      {investments.length === 0 ? (
        <div className="glass-card-static p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
            <Briefcase size={24} className="text-[var(--muted)]" />
          </div>
          <p className="text-[var(--muted)] text-sm">
            No hay inversiones aun
          </p>
          <p className="text-[var(--muted)] text-xs mt-1">
            Agrega tu primera inversion para empezar a trackear
          </p>
        </div>
      ) : (
        <div className="glass-card-static overflow-hidden">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th className="text-right">Invertido</th>
                <th className="text-right">Valor actual</th>
                <th className="text-right">Retorno</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv: any) => {
                const invested = parseFloat(inv.investedAmount);
                const current = parseFloat(inv.currentValue);
                const returnPct =
                  invested > 0
                    ? (((current - invested) / invested) * 100).toFixed(1)
                    : "0.0";
                const isPositive = current >= invested;
                return (
                  <tr key={inv.id}>
                    <td>
                      <span className="font-medium">{inv.name}</span>
                    </td>
                    <td>
                      <span className="badge badge-muted">
                        {typeLabels[inv.type] || inv.type}
                      </span>
                    </td>
                    <td className="text-right tabular-nums text-[var(--foreground-muted)]">
                      {formatMoney(invested, inv.currency)}
                    </td>
                    <td className="text-right tabular-nums font-medium">
                      {formatMoney(current, inv.currency)}
                    </td>
                    <td className="text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold tabular-nums ${
                          isPositive
                            ? "text-[var(--accent-green)]"
                            : "text-[var(--accent-red)]"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp size={14} />
                        ) : (
                          <TrendingDown size={14} />
                        )}
                        {returnPct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
