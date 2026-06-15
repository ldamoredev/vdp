import { Link, useSearchParams } from "react-router";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { ModulePage } from "@/components/primitives/module-page";
import { StateCard } from "@/components/primitives/state-card";
import { buildInitialTransactionFilters } from "@/core/domain/wallet/Transaction";
import type {
  TransactionRowVM,
  TransactionTypeFilter,
  TransactionsViewModel,
} from "@/ui/models/wallet/TransactionsViewModel";
import { SanityStrip } from "../components/sanity-strip";
import { WalletEmptyState } from "../components/wallet-empty-state";
import { EditTransactionSheet } from "./EditTransactionSheet";
import { useTransactionsPresenter } from "./useTransactionsPresenter";

export function TransactionsScreen() {
  const [searchParams] = useSearchParams();
  const initialFilters = buildInitialTransactionFilters({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
  });
  const presenter = useTransactionsPresenter(initialFilters);
  const vm = presenter.model;

  return (
    <ModulePage width="5xl" spacing="6">
      <Header vm={vm} />
      <Filters vm={vm} presenter={presenter} />
      <SanityStrip
        transactionCount={vm.sanity.transactionCount}
        totalAmount={vm.sanity.totalAmountLabel}
        dateRange={vm.sanity.dateRange}
      />
      <TransactionsTable vm={vm} presenter={presenter} />
      {vm.pagination.show && <Pagination vm={vm} presenter={presenter} />}
      {vm.editSheet && <EditTransactionSheet vm={vm.editSheet} presenter={presenter} />}
    </ModulePage>
  );
}

function Header({ vm }: { vm: TransactionsViewModel }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{vm.title}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{vm.intro}</p>
      </div>
      <Link to={vm.addHref} className="btn-primary w-full justify-center sm:w-auto">
        <Plus size={16} />
        {vm.addButtonLabel}
      </Link>
    </div>
  );
}

function Filters({
  vm,
  presenter,
}: {
  vm: TransactionsViewModel;
  presenter: ReturnType<typeof useTransactionsPresenter>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-[var(--muted)]">
        <Filter size={14} />
        <span className="text-xs font-medium uppercase tracking-wider">{vm.filtersLabel}</span>
      </div>

      <select
        className="glass-input px-3 py-2 text-sm"
        value={vm.filters.type}
        onChange={(event) => void presenter.setTypeFilter(event.target.value as TransactionTypeFilter)}
      >
        {vm.filters.typeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <input
        type="date"
        className="glass-input px-3 py-2 text-sm"
        value={vm.filters.from}
        onChange={(event) => void presenter.setFrom(event.target.value)}
      />
      <input
        type="date"
        className="glass-input px-3 py-2 text-sm"
        value={vm.filters.to}
        onChange={(event) => void presenter.setTo(event.target.value)}
      />

      {vm.activeCategoryChip ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2 text-sm">
          <span>{vm.activeCategoryChip.label}</span>
          <button
            type="button"
            onClick={() => void presenter.clearCategoryFilter()}
            className="text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            aria-label="Quitar filtro de categoria"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TransactionsTable({
  vm,
  presenter,
}: {
  vm: TransactionsViewModel;
  presenter: ReturnType<typeof useTransactionsPresenter>;
}) {
  return (
    <div className="glass-card-static overflow-hidden">
      {vm.isLoading ? (
        <StateCard
          size="lg"
          className="border-none"
          description="Cargando..."
          icon={
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          }
        />
      ) : vm.emptyState ? (
        <WalletEmptyState {...vm.emptyState} />
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
            {vm.rows.map((row) => (
              <TransactionRow key={row.id} row={row} presenter={presenter} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TransactionRow({
  row,
  presenter,
}: {
  row: TransactionRowVM;
  presenter: ReturnType<typeof useTransactionsPresenter>;
}) {
  return (
    <tr
      onClick={row.isEditable ? () => presenter.openEdit(row.id) : undefined}
      className={row.isEditable ? "cursor-pointer transition-colors hover:bg-[var(--hover-overlay)]" : undefined}
    >
      <td className="text-[var(--foreground-muted)]">{row.dateLabel}</td>
      <td>
        <div className="flex items-center gap-3">
          <TypeIcon tone={row.typeTone} />
          <span className="font-medium">{row.descriptionLabel}</span>
        </div>
      </td>
      <td>
        <span
          className={`badge ${
            row.typeTone === "income"
              ? "badge-green"
              : row.typeTone === "expense"
                ? "badge-red"
                : "badge-blue"
          }`}
        >
          {row.typeLabel}
        </span>
      </td>
      <td
        className={`text-right font-data font-semibold tabular-nums ${
          row.amountTone === "income"
            ? "text-[var(--accent-green)]"
            : row.amountTone === "expense"
              ? "text-[var(--accent-red)]"
              : "text-[var(--accent)]"
        }`}
      >
        {row.amountLabel}
      </td>
      <td>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void presenter.deleteTransaction(row.id);
          }}
          disabled={row.isBusy}
          className="rounded-lg p-2 text-[var(--muted)] transition-all hover:bg-[var(--accent-red-glow)] hover:text-[var(--accent-red)] disabled:opacity-40"
          aria-label="Eliminar transaccion"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

function TypeIcon({ tone }: { tone: TransactionRowVM["typeTone"] }) {
  if (tone === "income") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-green-glow)]">
        <ArrowDownLeft size={14} className="text-[var(--accent-green)]" />
      </div>
    );
  }
  if (tone === "expense") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-red-glow)]">
        <ArrowUpRight size={14} className="text-[var(--accent-red)]" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-glow)]">
      <ArrowLeftRight size={14} className="text-[var(--accent)]" />
    </div>
  );
}

function Pagination({
  vm,
  presenter,
}: {
  vm: TransactionsViewModel;
  presenter: ReturnType<typeof useTransactionsPresenter>;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-[var(--muted)]">{vm.pagination.label}</p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!vm.pagination.canGoPrevious}
          onClick={() => void presenter.previousPage()}
          className="btn-secondary px-3 py-2 disabled:opacity-30"
        >
          <ChevronLeft size={16} />
          Anterior
        </button>
        <button
          type="button"
          disabled={!vm.pagination.canGoNext}
          onClick={() => void presenter.nextPage()}
          className="btn-secondary px-3 py-2 disabled:opacity-30"
        >
          Siguiente
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
