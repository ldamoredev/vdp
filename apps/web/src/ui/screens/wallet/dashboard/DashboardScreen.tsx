import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Plus,
  Wallet,
} from "lucide-react";

import { CollectionCard } from "@/ui/primitives/collection-card";
import { ModuleHeader } from "@/ui/primitives/module-header";
import { ModulePage } from "@/ui/primitives/module-page";
import { StatTile } from "@/ui/primitives/stat-tile";
import { StateCard } from "@/ui/primitives/state-card";
import { BoardSection } from "@/ui/screens/tasks/board/BoardSection";
import type {
  DashboardAccountVM,
  DashboardStatVM,
  DashboardTransactionRowVM,
  DashboardViewModel,
} from "@/ui/models/wallet/DashboardViewModel";
import { SanityStrip } from "../components/sanity-strip";
import { WalletEmptyState } from "../components/wallet-empty-state";
import { QuickAddExpenseSheet } from "../transactions/QuickAddExpenseSheet";
import { EditTransactionSheet } from "../transactions/EditTransactionSheet";
import { useDashboardPresenter } from "./useDashboardPresenter";

export function DashboardScreen() {
  const presenter = useDashboardPresenter();
  const vm = presenter.model;
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <ModulePage width="5xl" spacing="8">
      <OperationalHeader vm={vm} onQuickAdd={() => setQuickAddOpen(true)} />
      <AccountsGrid vm={vm} />
      <SanityStrip
        transactionCount={vm.sanity.transactionCount}
        totalAmount={vm.sanity.totalAmountLabel}
        label={vm.sanity.label}
      />
      <RecentTransactions vm={vm} presenter={presenter} />
      <BoardSection domain="wallet" />

      <button
        type="button"
        onClick={() => setQuickAddOpen(true)}
        aria-label="Cargar gasto rápido"
        className="fixed right-6 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_10px_30px_var(--accent-glow)] transition-transform hover:scale-105 sm:hidden"
      >
        <Plus size={24} />
      </button>

      {isQuickAddOpen && (
        <QuickAddExpenseSheet
          open={isQuickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          onSaved={() => void presenter.reload()}
        />
      )}

      {vm.editSheet && <EditTransactionSheet vm={vm.editSheet} presenter={presenter} />}
    </ModulePage>
  );
}

function OperationalHeader({
  vm,
  onQuickAdd,
}: {
  vm: DashboardViewModel;
  onQuickAdd: () => void;
}) {
  return (
    <div className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--divider)] p-5 md:p-6">
        <ModuleHeader
          eyebrow={vm.eyebrow}
          title={vm.title}
          icon={<Wallet size={20} />}
          description={vm.intro}
          actions={
            <>
              <button
                type="button"
                onClick={onQuickAdd}
                className="btn-primary w-full justify-center sm:w-auto"
              >
                <Plus size={16} />
                {vm.quickAddLabel}
              </button>
              <Link to={vm.newTransactionHref} className="btn-secondary w-full justify-center sm:w-auto">
                {vm.newTransactionLabel}
              </Link>
              <Link to={vm.statsHref} className="btn-secondary w-full justify-center sm:w-auto">
                {vm.statsLabel}
                <ArrowRight size={14} />
              </Link>
            </>
          }
        />
      </div>

      <div className="grid gap-3 p-5 md:grid-cols-3 md:p-6">
        {vm.stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ stat }: { stat: DashboardStatVM }) {
  const tone = stat.tone === "income" ? "green" : stat.tone === "expense" ? "red" : "default";
  return <StatTile label={stat.label} value={stat.valueLabel} tone={tone} />;
}

function AccountsGrid({ vm }: { vm: DashboardViewModel }) {
  if (vm.isLoadingAccounts) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StateCard
          state="loading"
          size="sm"
          className="glass-card-static border-none"
          aria-label="Cargando cuentas"
        />
        <StateCard
          state="loading"
          size="sm"
          className="glass-card-static border-none"
          aria-label="Cargando cuentas"
        />
        <StateCard
          state="loading"
          size="sm"
          className="glass-card-static border-none"
          aria-label="Cargando cuentas"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 stagger-children">
      {vm.accounts.map((account) => (
        <AccountCard key={account.id} account={account} />
      ))}
    </div>
  );
}

function AccountCard({ account }: { account: DashboardAccountVM }) {
  return (
    <div className="glass-card p-5 transition-all hover:shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-sm text-[var(--foreground-muted)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-glow)]">
            <Wallet size={15} className="text-[var(--accent)]" />
          </div>
          <span className="font-medium">{account.name}</span>
        </div>
        <span className="badge badge-muted">{account.currency}</span>
      </div>
      <div className="truncate text-2xl font-data font-bold tracking-tight tabular-nums">
        {account.balanceLabel}
      </div>
    </div>
  );
}

function RecentTransactions({
  vm,
  presenter,
}: {
  vm: DashboardViewModel;
  presenter: ReturnType<typeof useDashboardPresenter>;
}) {
  return (
    <CollectionCard
      title={vm.recentTitle}
      icon={null}
      action={
        <Link
          to={vm.recentHref}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] transition-colors hover:text-[var(--blue-soft-text)]"
        >
          {vm.recentActionLabel}
          <ArrowRight size={12} />
        </Link>
      }
    >
      {vm.isLoadingRecentTransactions ? (
        <StateCard
          state="loading"
          size="sm"
          className="border-none"
          aria-label="Cargando movimientos"
        />
      ) : vm.recentTransactions.length === 0 ? (
        <WalletEmptyState
          title="Todavía no hay movimientos"
          body="Cuando registres ingresos o gastos, los vas a ver ordenados y listos para revisar."
          ctaLabel="Registrar movimiento"
          ctaHref="/wallet/transactions/new"
        />
      ) : (
        vm.recentTransactions.map((transaction) => (
          <RecentTransactionRow
            key={transaction.id}
            transaction={transaction}
            onClick={transaction.isEditable ? () => presenter.openEdit(transaction.id) : undefined}
          />
        ))
      )}
    </CollectionCard>
  );
}

function RecentTransactionRow({
  transaction,
  onClick,
}: {
  transaction: DashboardTransactionRowVM;
  onClick?: () => void;
}) {
  const amountTone =
    transaction.tone === "income"
      ? "text-[var(--accent-green)]"
      : transaction.tone === "expense"
        ? "text-[var(--accent-red)]"
        : "text-[var(--accent)]";
  const content = (
    <>
      <div className="flex items-center gap-3">
        <TransactionIcon tone={transaction.tone} />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-[var(--foreground)]">
            {transaction.descriptionLabel}
          </div>
          <div className="text-xs text-[var(--muted)]">{transaction.metaLabel}</div>
        </div>
      </div>
      <div className={`text-right text-sm font-data font-semibold tabular-nums ${amountTone}`}>
        {transaction.amountLabel}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 rounded-xl p-4 text-left transition-all hover:bg-[var(--hover-overlay)]"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl p-4 transition-all hover:bg-[var(--hover-overlay)]">
      {content}
    </div>
  );
}

function TransactionIcon({ tone }: { tone: DashboardTransactionRowVM["tone"] }) {
  if (tone === "income") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-green-glow)]">
        <ArrowDownLeft size={16} className="text-[var(--accent-green)]" />
      </div>
    );
  }
  if (tone === "expense") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-red-glow)]">
        <ArrowUpRight size={16} className="text-[var(--accent-red)]" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-glow)]">
      <ArrowLeftRight size={16} className="text-[var(--accent)]" />
    </div>
  );
}
