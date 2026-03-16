"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { walletApi } from "@/lib/api/wallet";
import { formatMoney, formatDate } from "@/lib/format";
import { useState } from "react";
import {
  Plus,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import Link from "next/link";

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Record<string, string>>({
    limit: "20",
    offset: "0",
  });

  const { data: result, isLoading } = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => walletApi.getTransactions(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => walletApi.deleteTransaction(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const transactions = result?.data || [];
  const total = result?.total || 0;
  const currentPage =
    Math.floor(parseInt(filters.offset) / parseInt(filters.limit)) + 1;
  const totalPages = Math.ceil(total / parseInt(filters.limit));

  function getTypeIcon(type: string) {
    switch (type) {
      case "income":
        return (
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-green-glow)] flex items-center justify-center">
            <ArrowDownLeft size={14} className="text-[var(--accent-green)]" />
          </div>
        );
      case "expense":
        return (
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-red-glow)] flex items-center justify-center">
            <ArrowUpRight size={14} className="text-[var(--accent-red)]" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center">
            <ArrowLeftRight size={14} className="text-[var(--accent)]" />
          </div>
        );
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case "income":
        return <span className="badge badge-green">Ingreso</span>;
      case "expense":
        return <span className="badge badge-red">Gasto</span>;
      default:
        return <span className="badge badge-blue">Transferencia</span>;
    }
  }

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Transacciones
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            {total} transacciones en total
          </p>
        </div>
        <Link href="/wallet/transactions/new" className="btn-primary cursor-pointer">
          <Plus size={16} />
          Nueva
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <Filter size={14} />
          <span className="text-xs font-medium uppercase tracking-wider">
            Filtros
          </span>
        </div>
        <select
          className="glass-input px-3 py-2 text-sm cursor-pointer"
          value={filters.type || ""}
          onChange={(e) =>
            setFilters((f) => {
              const next: Record<string, string> = { ...f, offset: "0" };
              if (e.target.value) next.type = e.target.value;
              else delete next.type;
              return next;
            })
          }
        >
          <option value="">Todos los tipos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
          <option value="transfer">Transferencias</option>
        </select>
        <input
          type="date"
          className="glass-input px-3 py-2 text-sm"
          value={filters.from || ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, from: e.target.value, offset: "0" }))
          }
        />
        <input
          type="date"
          className="glass-input px-3 py-2 text-sm"
          value={filters.to || ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, to: e.target.value, offset: "0" }))
          }
        />
      </div>

      {/* Table */}
      <div className="glass-card-static overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center">
            <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[var(--muted)] mt-3">Cargando...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
              <ArrowLeftRight size={20} className="text-[var(--muted)]" />
            </div>
            <p className="text-[var(--muted)] text-sm">
              No hay transacciones
            </p>
          </div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripcion</th>
                <th>Tipo</th>
                <th className="text-right">Monto</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: any) => (
                <tr key={tx.id}>
                  <td className="text-[var(--foreground-muted)]">
                    {formatDate(tx.date)}
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      {getTypeIcon(tx.type)}
                      <span className="font-medium">
                        {tx.description || "-"}
                      </span>
                    </div>
                  </td>
                  <td>{getTypeLabel(tx.type)}</td>
                  <td
                    className={`text-right font-semibold tabular-nums ${
                      tx.type === "income"
                        ? "text-[var(--accent-green)]"
                        : tx.type === "expense"
                        ? "text-[var(--accent-red)]"
                        : "text-[var(--accent)]"
                    }`}
                  >
                    {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                    {formatMoney(tx.amount, tx.currency)}
                  </td>
                  <td>
                    <button
                      onClick={() => deleteMutation.mutate(tx.id)}
                      className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--accent-red)] hover:bg-[var(--accent-red-glow)] transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--muted)]">
            Pagina {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={filters.offset === "0"}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  offset: String(
                    Math.max(0, parseInt(f.offset) - parseInt(f.limit))
                  ),
                }))
              }
              className="btn-secondary px-3 py-2 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
            <button
              disabled={
                parseInt(filters.offset) + parseInt(filters.limit) >= total
              }
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  offset: String(parseInt(f.offset) + parseInt(f.limit)),
                }))
              }
              className="btn-secondary px-3 py-2 disabled:opacity-30 cursor-pointer"
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
