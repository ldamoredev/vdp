import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { Currency } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { GetAccounts } from "@/core/app/wallet/GetAccounts";
import { GetTransactions } from "@/core/app/wallet/GetTransactions";
import { GetWalletStatsSummary } from "@/core/app/wallet/GetWalletStatsSummary";
import { UpdateTransaction } from "@/core/app/wallet/UpdateTransaction";
import type { Account } from "@/core/domain/wallet/Account";
import type { Category } from "@/core/domain/wallet/Category";
import type { Transaction } from "@/core/domain/wallet/Transaction";
import type { UpdateTransactionInput } from "@/core/domain/wallet/WalletGateway";
import type { WalletStatsSummary } from "@/core/domain/wallet/WalletStats";
import { GetCategories } from "@/core/app/wallet/GetCategories";
import { EnsureFreshDollarRates } from "@/core/app/wallet/EnsureFreshDollarRates";
import { MaterializeDueRecurringTransactions } from "@/core/app/wallet/MaterializeDueRecurringTransactions";
import { formatDate, formatMoney } from "@/lib/format";
import {
  getPresentationCurrency,
  setPresentationCurrency,
  subscribePresentationCurrency,
} from "@/lib/preferences/presentation-currency";
import type {
  DashboardAccountVM,
  DashboardStatVM,
  DashboardTransactionRowVM,
  DashboardViewModel,
  EditTransactionFormField,
  EditTransactionSheetVM,
} from "@/ui/models/wallet/DashboardViewModel";
import { walletScreenIntro } from "../wallet-copy";

interface EditTransactionFormState {
  amount: string;
  categoryId: string;
  description: string;
  date: string;
  accountId: string;
}

const TYPE_PRESENTATION: Record<
  Transaction["type"],
  { label: string; sign: string; tone: "income" | "expense" | "transfer" }
> = {
  income: { label: "Ingreso", sign: "+", tone: "income" },
  expense: { label: "Gasto", sign: "-", tone: "expense" },
  transfer: { label: "Transferencia", sign: "", tone: "transfer" },
};

const PRESENTATION_CURRENCY_OPTIONS: Currency[] = ["ARS", "USD"];

function editFormFrom(transaction: Transaction): EditTransactionFormState {
  return {
    amount: transaction.amount,
    categoryId: transaction.categoryId ?? "",
    description: transaction.description ?? "",
    date: transaction.date,
    accountId: transaction.accountId,
  };
}

function validateTransactionFields(fields: EditTransactionFormState): string | null {
  if (fields.amount.trim() === "") return "Ingresá un monto";
  const numericAmount = Number(fields.amount);
  if (Number.isNaN(numericAmount)) return "El monto no es un número válido";
  if (numericAmount <= 0) return "El monto debe ser mayor a cero";
  if (fields.date.trim() === "") return "Ingresá una fecha";
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

export class DashboardPresenter extends PresenterBase<DashboardViewModel> {
  private accounts: Account[] = [];
  private categories: Category[] = [];
  private recentTransactions: Transaction[] = [];
  private statsSummary: WalletStatsSummary | null = null;
  private presentationCurrency: Currency = getPresentationCurrency();
  private isLoadingAccounts = true;
  private isLoadingStats = true;
  private isLoadingRecentTransactions = true;
  private error = false;
  private statsError = false;
  private statsLoadRequestId = 0;
  private unsubscribeCurrency: (() => void) | null = null;
  private ratesEnsured = false;

  private editingId: string | null = null;
  private editForm: EditTransactionFormState | null = null;
  private editMessage: string | null = null;
  private isUpdating = false;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): DashboardViewModel {
    return this.buildModel();
  }

  start(): void {
    this.presentationCurrency = getPresentationCurrency();
    this.unsubscribeCurrency = subscribePresentationCurrency(() => this.syncPresentationCurrency());
    void this.bootstrap();
  }

  /** Load right away, then refresh a stale MEP quote in the background and
   * reload only the summary — the external quote never blocks first paint. */
  private async bootstrap(): Promise<void> {
    await this.materializeRecurring();
    await this.reload();
    await this.ensureFreshRates();
  }

  /** D1c: turn due recurring rules into real transactions before reading the
   * dashboard, so they show up in the list and stats. Best-effort — a failure
   * must never block the dashboard. */
  private async materializeRecurring(): Promise<void> {
    try {
      await this.core.execute(new MaterializeDueRecurringTransactions());
    } catch {
      // Non-blocking: the dashboard still loads what already exists.
    }
  }

  private async ensureFreshRates(): Promise<void> {
    if (this.ratesEnsured) return;
    this.ratesEnsured = true;
    try {
      const refreshed = await this.core.execute(new EnsureFreshDollarRates());
      if (refreshed) await this.loadStats();
    } catch {
      // A failed refresh surfaces later as statsError when conversion can't run.
    }
  }

  stop(): void {
    this.unsubscribeCurrency?.();
    this.unsubscribeCurrency = null;
  }

  async reload(): Promise<void> {
    await Promise.all([this.loadAccounts(), this.loadStats(), this.loadRecentTransactions(), this.loadCategories()]);
  }

  /** Writes the universal preference; the subscription reloads the summary. */
  setPresentationCurrency(currency: Currency): void {
    setPresentationCurrency(currency);
  }

  private syncPresentationCurrency(): void {
    const next = getPresentationCurrency();
    if (next === this.presentationCurrency) return;
    this.presentationCurrency = next;
    void this.loadStats();
  }

  openEdit(id: string): void {
    const transaction = this.recentTransactions.find((candidate) => candidate.id === id);
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
      await Promise.all([this.loadStats(), this.loadRecentTransactions(), this.loadAccounts()]);
    } catch {
      this.editMessage = "No se pudo guardar la transacción";
    } finally {
      this.isUpdating = false;
      this.refresh();
    }
  }

  private async loadAccounts(): Promise<void> {
    this.isLoadingAccounts = true;
    this.refresh();
    try {
      this.accounts = await this.core.execute(new GetAccounts());
      this.error = false;
    } catch {
      this.error = true;
    } finally {
      this.isLoadingAccounts = false;
      this.refresh();
    }
  }

  private async loadCategories(): Promise<void> {
    try {
      this.categories = await this.core.execute(new GetCategories());
    } catch {
      this.error = true;
    } finally {
      this.refresh();
    }
  }

  private async loadStats(): Promise<void> {
    const requestId = this.statsLoadRequestId + 1;
    this.statsLoadRequestId = requestId;
    this.isLoadingStats = true;
    this.refresh();
    try {
      const summary = await this.core.execute(new GetWalletStatsSummary(this.statsParams()));
      if (requestId !== this.statsLoadRequestId) return;
      this.statsSummary = summary;
      this.statsError = false;
    } catch {
      if (requestId !== this.statsLoadRequestId) return;
      // Drop the stale summary so the tiles never show the previous currency's
      // numbers as if they had been converted.
      this.statsSummary = null;
      this.statsError = true;
    }
    // Only the latest request reaches here (stale ones returned above), so it is
    // safe to clear the loading flag and publish the result.
    this.isLoadingStats = false;
    this.refresh();
  }

  private async loadRecentTransactions(): Promise<void> {
    this.isLoadingRecentTransactions = true;
    this.refresh();
    try {
      const result = await this.core.execute(new GetTransactions({ limit: "10" }));
      this.recentTransactions = result.transactions;
      this.error = false;
    } catch {
      this.error = true;
    } finally {
      this.isLoadingRecentTransactions = false;
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): DashboardViewModel {
    return {
      title: "Wallet",
      intro: walletScreenIntro("dashboard"),
      eyebrow: "Resumen operativo",
      quickAddLabel: "Gasto rápido",
      newTransactionLabel: "Nueva transacción",
      newTransactionHref: "/wallet/transactions/new",
      statsLabel: "Ver estadísticas",
      statsHref: "/wallet/stats",
      presentationCurrency: this.presentationCurrency,
      currencyOptions: this.currencyOptionsVM(),
      stats: this.statsVM(),
      accounts: this.accounts.map((account) => this.accountVM(account)),
      recentTransactions: this.recentTransactions.map((transaction) => this.transactionVM(transaction)),
      recentTitle: "Transacciones recientes",
      recentHref: "/wallet/transactions",
      recentActionLabel: "Ver todas",
      sanity: this.sanityVM(),
      editSheet: this.editSheetVM(),
      isLoadingAccounts: this.isLoadingAccounts,
      isLoadingStats: this.isLoadingStats,
      isLoadingRecentTransactions: this.isLoadingRecentTransactions,
      statsError: this.statsError,
      error: this.error,
    };
  }

  private statsParams(): Record<string, string> {
    return { currency: this.presentationCurrency };
  }

  private currencyOptionsVM(): DashboardViewModel["currencyOptions"] {
    return PRESENTATION_CURRENCY_OPTIONS.map((currency) => ({
      currency,
      label: currency,
      selected: currency === this.presentationCurrency,
    }));
  }

  private statsVM(): DashboardStatVM[] {
    const currency = this.statsSummary?.currency ?? "ARS";

    return [
      {
        label: "Ingresos",
        valueLabel: `+${formatMoney(Number(this.statsSummary?.totalIncome ?? 0), currency)}`,
        tone: "income",
      },
      {
        label: "Gastos",
        valueLabel: `-${formatMoney(Number(this.statsSummary?.totalExpenses ?? 0), currency)}`,
        tone: "expense",
      },
      {
        label: "Neto",
        valueLabel: formatMoney(Number(this.statsSummary?.netBalance ?? 0), currency),
        tone: "neutral",
      },
    ];
  }

  private accountVM(account: Account): DashboardAccountVM {
    const balance = Number(account.currentBalance ?? account.initialBalance);
    return {
      id: account.id,
      name: account.name,
      currency: account.currency,
      balanceLabel: formatMoney(balance, account.currency),
    };
  }

  private transactionVM(transaction: Transaction): DashboardTransactionRowVM {
    const presentation = TYPE_PRESENTATION[transaction.type];
    return {
      id: transaction.id,
      descriptionLabel: transaction.description || presentation.label,
      metaLabel: this.transactionMeta(transaction),
      amountLabel: `${presentation.sign}${formatMoney(transaction.amount, transaction.currency)}`,
      tone: presentation.tone,
      isEditable: !transaction.isTransfer,
    };
  }

  private transactionMeta(transaction: Transaction): string {
    const parts = [transaction.categoryName, formatDate(transaction.date)].filter(Boolean);
    return parts.join(" · ");
  }

  private sanityVM() {
    const currency = this.statsSummary?.currency ?? "ARS";

    return {
      transactionCount: this.statsSummary?.transactionCount ?? 0,
      totalAmountLabel: formatMoney(Number(this.statsSummary?.totalExpenses ?? 0), currency),
      label: "en gastos",
    };
  }

  private editSheetVM(): EditTransactionSheetVM | null {
    const transaction = this.editingTransaction();
    if (!transaction || !this.editForm) return null;
    return {
      title: "Editar transacción",
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
    return this.recentTransactions.find((transaction) => transaction.id === this.editingId) ?? null;
  }
}
