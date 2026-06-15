import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { DeleteTransaction } from "@/core/app/wallet/DeleteTransaction";
import { GetAccounts } from "@/core/app/wallet/GetAccounts";
import { GetCategories } from "@/core/app/wallet/GetCategories";
import { GetTransactions } from "@/core/app/wallet/GetTransactions";
import { UpdateTransaction } from "@/core/app/wallet/UpdateTransaction";
import type { Account } from "@/core/domain/wallet/Account";
import type { Category } from "@/core/domain/wallet/Category";
import {
  buildInitialTransactionFilters,
  buildTransactionPagination,
  buildVisibleTransactionTotal,
  type Transaction,
  type TransactionType,
  type WalletTransactionFilters,
} from "@/core/domain/wallet/Transaction";
import type { UpdateTransactionInput } from "@/core/domain/wallet/WalletGateway";
import { formatDate, formatMoney } from "@/lib/format";
import type {
  EditTransactionFormField,
  EditTransactionSheetVM,
  TransactionFiltersVM,
  TransactionPaginationVM,
  TransactionRowVM,
  TransactionsViewModel,
} from "@/ui/models/wallet/TransactionsViewModel";
import { walletEmptyState, walletScreenIntro } from "../wallet-copy";

interface EditTransactionFormState {
  amount: string;
  categoryId: string;
  description: string;
  date: string;
  accountId: string;
}

const TYPE_OPTIONS = [
  { value: "", label: "Todos los tipos" },
  { value: "income", label: "Ingresos" },
  { value: "expense", label: "Gastos" },
  { value: "transfer", label: "Transferencias" },
];

const TYPE_PRESENTATION: Record<
  TransactionType,
  { label: string; sign: string; tone: "income" | "expense" | "transfer" }
> = {
  income: { label: "Ingreso", sign: "+", tone: "income" },
  expense: { label: "Gasto", sign: "-", tone: "expense" },
  transfer: { label: "Transferencia", sign: "", tone: "transfer" },
};

function editFormFrom(transaction: Transaction): EditTransactionFormState {
  return {
    amount: transaction.amount,
    categoryId: transaction.categoryId ?? "",
    description: transaction.description ?? "",
    date: transaction.date,
    accountId: transaction.accountId,
  };
}

function validateTransactionFields(fields: {
  amount: string;
  accountId: string;
  date?: string;
}): string | null {
  if (fields.amount.trim() === "") return "Ingresá un monto";
  const numericAmount = Number(fields.amount);
  if (Number.isNaN(numericAmount)) return "El monto no es un número válido";
  if (numericAmount <= 0) return "El monto debe ser mayor a cero";
  if (fields.date !== undefined && fields.date.trim() === "") return "Ingresá una fecha";
  if (fields.accountId.trim() === "") return "Elegí una cuenta";
  return null;
}

function updatePayload(original: Transaction, form: EditTransactionFormState): UpdateTransactionInput | null {
  const payload: UpdateTransactionInput = {};

  if (form.amount !== original.amount) payload.amount = form.amount;

  const nextCategoryId = form.categoryId === "" ? null : form.categoryId;
  if (nextCategoryId !== original.categoryId) payload.categoryId = nextCategoryId;

  const trimmedDescription = form.description.trim();
  const normalizedDescription = trimmedDescription === "" ? null : trimmedDescription;
  const originalDescription =
    original.description?.trim() === "" ? null : (original.description ?? null);
  if (normalizedDescription !== originalDescription) payload.description = normalizedDescription;

  if (form.date !== original.date) payload.date = form.date;
  if (form.accountId !== original.accountId) payload.accountId = form.accountId;

  return Object.keys(payload).length === 0 ? null : payload;
}

export class TransactionsPresenter extends PresenterBase<TransactionsViewModel> {
  private accounts: Account[] = [];
  private categories: Category[] = [];
  private transactions: Transaction[] = [];
  private totalTransactions = 0;
  private filters: WalletTransactionFilters;
  private isLoading = true;
  private error = false;
  private busyIds = new Set<string>();

  private editingId: string | null = null;
  private editForm: EditTransactionFormState | null = null;
  private editMessage: string | null = null;
  private isUpdating = false;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
    initialFilters: Partial<WalletTransactionFilters> = {},
  ) {
    super(onChange);
    this.filters = { ...buildInitialTransactionFilters(), ...initialFilters };
  }

  protected initModel(): TransactionsViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.loadAll();
  }

  stop(): void {}

  async setTypeFilter(value: TransactionType | ""): Promise<void> {
    await this.setFilters({ type: value || undefined, offset: "0" });
  }

  async setFrom(value: string): Promise<void> {
    await this.setFilters({ from: value || undefined, offset: "0" });
  }

  async setTo(value: string): Promise<void> {
    await this.setFilters({ to: value || undefined, offset: "0" });
  }

  async clearCategoryFilter(): Promise<void> {
    await this.setFilters({ categoryId: undefined, offset: "0" });
  }

  async previousPage(): Promise<void> {
    const limit = Number(this.filters.limit);
    const offset = Math.max(0, Number(this.filters.offset) - limit);
    await this.setFilters({ offset: String(offset) }, false);
  }

  async nextPage(): Promise<void> {
    const limit = Number(this.filters.limit);
    const offset = Number(this.filters.offset) + limit;
    await this.setFilters({ offset: String(offset) }, false);
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.runForId(id, async () => {
      await this.core.execute(new DeleteTransaction(id));
      await this.loadTransactions();
    });
  }

  openEdit(id: string): void {
    const transaction = this.transactions.find((candidate) => candidate.id === id);
    if (!transaction || transaction.isTransfer) return;
    this.editingId = id;
    this.editForm = editFormFrom(transaction);
    this.editMessage = null;
    this.refresh();
  }

  closeEdit(): void {
    this.editingId = null;
    this.editForm = null;
    this.editMessage = null;
    this.refresh();
  }

  setEditField(field: EditTransactionFormField, value: string): void {
    if (!this.editForm) return;
    this.editForm = { ...this.editForm, [field]: value };
    this.editMessage = null;
    this.refresh();
  }

  async submitEdit(): Promise<void> {
    const transaction = this.editingTransaction();
    if (!transaction || !this.editForm) return;

    const validationError = validateTransactionFields(this.editForm);
    if (validationError) {
      this.editMessage = validationError;
      this.refresh();
      return;
    }

    const payload = updatePayload(transaction, this.editForm);
    if (!payload) {
      this.editMessage = "Sin cambios";
      this.refresh();
      return;
    }

    this.isUpdating = true;
    this.refresh();
    try {
      await this.core.execute(new UpdateTransaction(transaction.id, payload));
      this.closeEdit();
      await this.loadTransactions();
    } catch {
      this.editMessage = "No se pudo guardar la transaccion";
    } finally {
      this.isUpdating = false;
      this.refresh();
    }
  }

  private async setFilters(
    patch: Partial<WalletTransactionFilters>,
    resetPage = true,
  ): Promise<void> {
    this.filters = {
      ...this.filters,
      ...patch,
      offset: resetPage ? (patch.offset ?? "0") : (patch.offset ?? this.filters.offset),
    };
    await this.loadTransactions();
  }

  private async loadAll(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      const [accounts, categories] = await Promise.all([
        this.core.execute(new GetAccounts()),
        this.core.execute(new GetCategories()),
        this.loadTransactions(),
      ]);
      this.accounts = accounts;
      this.categories = categories;
      this.error = false;
    } catch {
      this.error = true;
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private async loadTransactions(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      const result = await this.core.execute(new GetTransactions(this.filters));
      this.transactions = result.transactions;
      this.totalTransactions = result.total;
      this.error = false;
    } catch {
      this.error = true;
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private async runForId(id: string, block: () => Promise<void>): Promise<void> {
    if (this.busyIds.has(id)) return;
    this.busyIds.add(id);
    this.refresh();
    try {
      await block();
    } finally {
      this.busyIds.delete(id);
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): TransactionsViewModel {
    return {
      title: "Transacciones",
      intro: walletScreenIntro("transactions"),
      addButtonLabel: "Nueva",
      addHref: "/wallet/transactions/new",
      filtersLabel: "Filtros",
      filters: this.filtersVM(),
      activeCategoryChip: this.activeCategoryChipVM(),
      sanity: this.sanityVM(),
      rows: this.transactions.map((transaction) => this.rowVM(transaction)),
      pagination: this.paginationVM(),
      editSheet: this.editSheetVM(),
      emptyState:
        !this.isLoading && this.transactions.length === 0 ? walletEmptyState("transactions") : null,
      isLoading: this.isLoading,
      error: this.error,
    };
  }

  private filtersVM(): TransactionFiltersVM {
    return {
      type: this.filters.type ?? "",
      from: this.filters.from ?? "",
      to: this.filters.to ?? "",
      typeOptions: TYPE_OPTIONS,
    };
  }

  private activeCategoryChipVM() {
    if (!this.filters.categoryId) return null;
    const category = this.categories.find((candidate) => candidate.id === this.filters.categoryId);
    return { label: `Filtro: ${category?.name || "Categoría"}` };
  }

  private sanityVM() {
    const visibleTotal = buildVisibleTransactionTotal(this.transactions);
    const totalAmountLabel =
      !visibleTotal.mixedCurrencies && visibleTotal.currency
        ? formatMoney(visibleTotal.amount, visibleTotal.currency)
        : "Varias monedas";

    return {
      transactionCount: this.transactions.length,
      totalAmountLabel,
      dateRange: this.dateRange(),
    };
  }

  private dateRange(): { from: string; to: string } | undefined {
    if (this.filters.from && this.filters.to) {
      return { from: this.filters.from, to: this.filters.to };
    }
    if (this.transactions.length === 0) return undefined;
    const dates = this.transactions.map((transaction) => transaction.date).sort();
    return { from: dates[0], to: dates[dates.length - 1] };
  }

  private rowVM(transaction: Transaction): TransactionRowVM {
    const presentation = TYPE_PRESENTATION[transaction.type];
    return {
      id: transaction.id,
      dateLabel: formatDate(transaction.date),
      descriptionLabel: transaction.description || "-",
      typeLabel: presentation.label,
      typeTone: presentation.tone,
      amountLabel: `${presentation.sign}${formatMoney(transaction.amount, transaction.currency)}`,
      amountTone: presentation.tone,
      isEditable: !transaction.isTransfer,
      isBusy: this.busyIds.has(transaction.id),
    };
  }

  private paginationVM(): TransactionPaginationVM {
    const pagination = buildTransactionPagination(this.filters, this.totalTransactions);
    return {
      show: pagination.totalPages > 1,
      label: `Pagina ${pagination.currentPage} de ${pagination.totalPages}`,
      canGoPrevious: pagination.canGoPrevious,
      canGoNext: pagination.canGoNext,
    };
  }

  private editSheetVM(): EditTransactionSheetVM | null {
    const transaction = this.editingTransaction();
    if (!transaction || !this.editForm) return null;
    return {
      title: "Editar transaccion",
      transactionId: transaction.id,
      amount: this.editForm.amount,
      currency: transaction.currency,
      accountId: this.editForm.accountId,
      categoryId: this.editForm.categoryId,
      description: this.editForm.description,
      date: this.editForm.date,
      accountOptions: this.accounts.map((account) => ({
        value: account.id,
        label: `${account.name} (${account.currency})`,
      })),
      categoryOptions: this.categories
        .filter((category) => category.type === transaction.type)
        .map((category) => ({
          value: category.id,
          label: `${category.icon ? `${category.icon} ` : ""}${category.name}`,
        })),
      message: this.editMessage,
      isSubmitting: this.isUpdating,
      canSubmit: !this.isUpdating,
    };
  }

  private editingTransaction(): Transaction | null {
    if (!this.editingId) return null;
    return this.transactions.find((transaction) => transaction.id === this.editingId) ?? null;
  }
}
