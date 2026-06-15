import { Link } from "react-router";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import type { HomeWalletSnapshotViewModel } from "@/ui/models/home/HomeViewModel";

export interface WalletSnapshotCardProps {
  readonly model: HomeWalletSnapshotViewModel;
}

export function WalletSnapshotCard({ model }: WalletSnapshotCardProps) {
  if (model.isLoading) {
    return (
      <div className="glass-card-static overflow-hidden" aria-busy="true">
        <Header />

        <div className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="h-20 animate-pulse rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)]" />
            <div className="h-20 animate-pulse rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)]" />
            <div className="h-20 animate-pulse rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)]" />
          </div>

          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
            <div className="mb-3 space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-[var(--background-secondary)]" />
              <div className="h-4 w-36 animate-pulse rounded bg-[var(--background-secondary)]" />
            </div>
            <div className="space-y-2">
              <div className="h-10 animate-pulse rounded-lg bg-[var(--background-secondary)]" />
              <div className="h-10 animate-pulse rounded-lg bg-[var(--background-secondary)]" />
              <div className="h-10 animate-pulse rounded-lg bg-[var(--background-secondary)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card-static overflow-hidden">
      <Header />

      <div className="space-y-4 p-4">
        <div className="space-y-3">
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-[var(--muted)]">Balance neto</span>
              <ArrowUpRight size={13} className="text-[var(--accent-green)]" />
            </div>
            <div className="truncate text-lg font-bold tracking-tight tabular-nums text-[var(--foreground)]">
              {model.netBalanceLabel}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">Ingresos</span>
                <ArrowDownLeft size={13} className="text-[var(--accent-green)]" />
              </div>
              <div className="truncate text-sm font-bold tracking-tight tabular-nums text-[var(--accent-green)]">
                {model.incomeLabel}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">Gastos</span>
                <ArrowUpRight size={13} className="text-[var(--accent-red)]" />
              </div>
              <div className="truncate text-sm font-bold tracking-tight tabular-nums text-[var(--accent-red)]">
                {model.expensesLabel}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-[var(--muted)]">Actividad reciente</div>
              <div className="text-sm font-medium text-[var(--foreground)]">
                {model.transactionCountLabel}
              </div>
            </div>
            <span className="badge-muted badge">{model.activityLabel}</span>
          </div>

          {model.recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {model.recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] bg-[var(--background-secondary)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[var(--foreground)]">
                      {transaction.descriptionLabel}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">
                      {transaction.dateLabel}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold tabular-nums ${
                      transaction.tone === "income"
                        ? "text-[var(--accent-green)]"
                        : "text-[var(--accent-red)]"
                    }`}
                  >
                    {transaction.amountLabel}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-[var(--muted)]">
              Todavia no hay movimientos recientes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
      <div className="flex items-center gap-2">
        <Wallet size={16} style={{ color: "var(--blue-soft-text)" }} />
        <h3 className="text-sm font-medium text-[var(--foreground)]">
          Resumen Wallet
        </h3>
      </div>
      <Link
        to="/wallet/transactions/new"
        className="flex items-center gap-1.5 text-xs font-medium text-[var(--blue-soft-text)] transition-colors hover:text-[var(--accent)]"
      >
        Nueva transaccion
        <ArrowRight size={12} />
      </Link>
    </div>
  );
}
