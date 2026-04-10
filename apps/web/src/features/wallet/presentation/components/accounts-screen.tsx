"use client";

import { useState } from "react";
import { Landmark, PencilLine, Plus, Trash2, Wallet2 } from "lucide-react";
import { ModulePage } from "@/components/primitives/module-page";
import { StateCard } from "@/components/primitives/state-card";
import { formatMoney } from "@/lib/format";
import { useWalletActions, useWalletData } from "../use-wallet-context";
import { accountTypeLabels } from "../wallet-selectors";
import {
  buildWalletEmptyState,
  buildWalletScreenIntro,
} from "../wallet-polish-selectors";
import { WalletEmptyState } from "./wallet-empty-state";

export function AccountsScreen() {
  const {
    accounts,
    showAccountForm,
    accountForm,
    isLoadingAccounts,
    isCreatingAccount,
    isDeletingAccount,
    isUpdatingAccount,
  } = useWalletData();
  const {
    toggleAccountForm,
    setAccountFormField,
    submitAccount,
    renameAccount,
    deleteAccount,
  } = useWalletActions();
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  return (
    <ModulePage width="5xl" spacing="6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Cuentas</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {buildWalletScreenIntro("accounts")}
          </p>
        </div>
        <button onClick={toggleAccountForm} className="btn-primary">
          <Plus size={16} />
          Nueva cuenta
        </button>
      </div>

      {showAccountForm && (
        <div className="glass-card-static animate-fade-in-up p-5">
          <h3 className="mb-4 text-sm font-semibold">Crear cuenta</h3>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void submitAccount();
            }}
          >
            <input
              value={accountForm.name}
              onChange={(event) => setAccountFormField("name", event.target.value)}
              placeholder="Ej: Brubank, Efectivo, Binance"
              className="glass-input w-full px-4 py-2.5 text-sm"
              required
            />

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <select
                value={accountForm.type}
                onChange={(event) => setAccountFormField("type", event.target.value)}
                className="glass-input px-4 py-2.5 text-sm"
              >
                <option value="bank">Banco</option>
                <option value="cash">Efectivo</option>
                <option value="crypto">Crypto</option>
                <option value="investment">Inversion</option>
              </select>

              <select
                value={accountForm.currency}
                onChange={(event) => setAccountFormField("currency", event.target.value)}
                className="glass-input px-4 py-2.5 text-sm"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>

              <input
                type="number"
                step="0.01"
                value={accountForm.initialBalance}
                onChange={(event) =>
                  setAccountFormField("initialBalance", event.target.value)
                }
                placeholder="Saldo inicial"
                className="glass-input px-4 py-2.5 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="btn-primary"
                disabled={isCreatingAccount}
              >
                {isCreatingAccount ? "Creando..." : "Guardar cuenta"}
              </button>
              <button
                type="button"
                onClick={toggleAccountForm}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoadingAccounts ? (
        <StateCard
          size="lg"
          className="glass-card-static border-none"
          description="Cargando cuentas..."
        />
      ) : accounts.length === 0 ? (
        <div className="glass-card-static border-none">
          <WalletEmptyState {...buildWalletEmptyState("accounts")} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 stagger-children">
          {accounts.map((account) => {
            const balance = Number(account.currentBalance ?? account.initialBalance);
            const isEditing = editingAccountId === account.id;

            return (
              <div key={account.id} className="glass-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-glow)]">
                      <Wallet2 size={18} className="text-[var(--accent)]" />
                    </div>
                    <div>
                      {isEditing ? (
                        <form
                          className="flex items-center gap-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            renameAccount(account.id, editingName.trim());
                            setEditingAccountId(null);
                            setEditingName("");
                          }}
                        >
                          <input
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            className="glass-input px-3 py-1.5 text-sm"
                            required
                          />
                          <button
                            type="submit"
                            className="btn-primary px-3 py-1.5 text-xs"
                            disabled={isUpdatingAccount}
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAccountId(null);
                              setEditingName("");
                            }}
                            className="btn-secondary px-3 py-1.5 text-xs"
                          >
                            Cancelar
                          </button>
                        </form>
                      ) : (
                        <>
                          <h3 className="font-medium">{account.name}</h3>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {accountTypeLabels[account.type]} · {account.currency}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingAccountId(account.id);
                          setEditingName(account.name);
                        }}
                        className="rounded-xl p-2 text-[var(--muted)] transition-colors hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)]"
                      >
                        <PencilLine size={16} />
                      </button>
                      <button
                        onClick={() => deleteAccount(account.id)}
                        disabled={isDeletingAccount}
                        className="rounded-xl p-2 text-[var(--muted)] transition-colors hover:bg-[var(--accent-red-glow)] hover:text-[var(--accent-red)]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3.5">
                    <p className="text-xs uppercase tracking-wider text-[var(--foreground-muted)]">
                      Balance actual
                    </p>
                    <p className="mt-1.5 text-lg font-bold tracking-tight">
                      {formatMoney(balance, account.currency as "ARS" | "USD")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3.5">
                    <p className="text-xs uppercase tracking-wider text-[var(--foreground-muted)]">
                      Saldo inicial
                    </p>
                    <p className="mt-1.5 text-lg font-bold tracking-tight">
                      {formatMoney(
                        Number(account.initialBalance),
                        account.currency as "ARS" | "USD",
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ModulePage>
  );
}
