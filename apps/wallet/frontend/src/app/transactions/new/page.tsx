"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewTransactionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: api.getAccounts,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
  });

  const [form, setForm] = useState({
    type: "expense" as string,
    amount: "",
    currency: "ARS",
    accountId: "",
    categoryId: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    tags: "",
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      router.push("/transactions");
    },
  });

  const filteredCategories = categories.filter(
    (c: any) => c.type === form.type || form.type === "transfer"
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      ...form,
      accountId: form.accountId || accounts[0]?.id,
      categoryId: form.categoryId || null,
      tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
    });
  }

  const typeOptions = [
    { value: "expense", label: "Gasto", color: "red" },
    { value: "income", label: "Ingreso", color: "green" },
    { value: "transfer", label: "Transferencia", color: "blue" },
  ];

  return (
    <div className="max-w-lg animate-fade-in">
      {/* Back link */}
      <Link
        href="/transactions"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer mb-6"
      >
        <ArrowLeft size={16} />
        Volver a transacciones
      </Link>

      <div className="glass-card-static p-6">
        <h2 className="text-xl font-semibold tracking-tight mb-6">
          Nueva transaccion
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
              Tipo
            </label>
            <div className="flex gap-2">
              {typeOptions.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    form.type === t.value
                      ? t.color === "red"
                        ? "bg-[var(--accent-red)] text-white shadow-lg shadow-red-500/20"
                        : t.color === "green"
                        ? "bg-[var(--accent-green)] text-white shadow-lg shadow-green-500/20"
                        : "bg-[var(--accent)] text-white shadow-lg shadow-blue-500/20"
                      : "glass-input text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount + Currency */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
              Monto
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                className="glass-input flex-1 px-4 py-2.5 text-sm"
                required
              />
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

          {/* Account */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
              Cuenta
            </label>
            <select
              value={form.accountId}
              onChange={(e) =>
                setForm((f) => ({ ...f, accountId: e.target.value }))
              }
              className="glass-input w-full px-4 py-2.5 text-sm cursor-pointer"
            >
              <option value="">Seleccionar cuenta</option>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          {form.type !== "transfer" && (
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
                Categoria
              </label>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value }))
                }
                className="glass-input w-full px-4 py-2.5 text-sm cursor-pointer"
              >
                <option value="">Sin categoria</option>
                {filteredCategories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
              Descripcion
            </label>
            <input
              type="text"
              placeholder="Ej: Almuerzo con amigos"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((f) => ({ ...f, date: e.target.value }))
              }
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
              Tags
            </label>
            <input
              type="text"
              placeholder="Separados por coma"
              value={form.tags}
              onChange={(e) =>
                setForm((f) => ({ ...f, tags: e.target.value }))
              }
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary flex-1 justify-center"
            >
              {mutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          {mutation.error && (
            <div className="p-3 rounded-xl bg-[var(--accent-red-glow)] border border-red-500/20">
              <p className="text-[var(--accent-red)] text-sm">
                {(mutation.error as Error).message}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
