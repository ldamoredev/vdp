import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { Currency } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { CreateTransaction } from "@/core/app/wallet/CreateTransaction";
import { GetAccounts } from "@/core/app/wallet/GetAccounts";
import { GetCategories } from "@/core/app/wallet/GetCategories";
import { GetTransactions } from "@/core/app/wallet/GetTransactions";
import type { Account } from "@/core/domain/wallet/Account";
import type { Category } from "@/core/domain/wallet/Category";
import type { Transaction } from "@/core/domain/wallet/Transaction";
import { getTodayISO } from "@/lib/format";
import type { QuickAddExpenseViewModel } from "@/ui/models/wallet/TransactionsViewModel";

interface QuickAddFormState {
  amount: string;
  accountId: string;
  categoryId: string;
  currency: Currency;
  description: string;
  date: string;
}

const RECENT_EXPENSES_FILTER = { limit: "20", type: "expense" as const };

function emptyForm(): QuickAddFormState {
  return {
    amount: "",
    accountId: "",
    categoryId: "",
    currency: "ARS",
    description: "",
    date: getTodayISO(),
  };
}

function pickMostFrequent<T extends string>(values: readonly T[]): T | null {
  if (values.length === 0) return null;
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  let bestValue: T | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      bestValue = value;
      bestCount = count;
    }
  }
  return bestValue;
}

function pickDefaultAccountId(
  accounts: readonly Account[],
  recentTransactions: readonly Transaction[],
): string {
  if (accounts.length === 0) return "";
  const validIds = new Set(accounts.map((account) => account.id));
  const recentAccountIds = recentTransactions
    .filter((transaction) => transaction.isExpense)
    .map((transaction) => transaction.accountId)
    .filter((id) => validIds.has(id));
  return pickMostFrequent(recentAccountIds) ?? accounts[0].id;
}

function pickDefaultCategoryId(
  categories: readonly Category[],
  recentTransactions: readonly Transaction[],
): string {
  const expenseCategories = categories.filter((category) => category.type === "expense");
  if (expenseCategories.length === 0) return "";
  const validIds = new Set(expenseCategories.map((category) => category.id));
  const recentCategoryIds = recentTransactions
    .filter((transaction) => transaction.isExpense)
    .map((transaction) => transaction.categoryId)
    .filter((id): id is string => typeof id === "string" && validIds.has(id));
  return pickMostFrequent(recentCategoryIds) ?? expenseCategories[0].id;
}

function pickDefaultCurrency(accounts: readonly Account[], accountId: string): Currency {
  return accounts.find((account) => account.id === accountId)?.currency ?? "ARS";
}

function validateQuickAdd(form: QuickAddFormState): string | null {
  if (form.amount.trim() === "") return "Ingresá un monto";
  const amount = Number(form.amount);
  if (Number.isNaN(amount)) return "El monto no es un número válido";
  if (amount <= 0) return "El monto debe ser mayor a cero";
  if (form.accountId.trim() === "") return "Elegí una cuenta";
  return null;
}

export class QuickAddExpensePresenter extends PresenterBase<QuickAddExpenseViewModel> {
  private accounts: Account[] = [];
  private categories: Category[] = [];
  private recentTransactions: Transaction[] = [];
  private form = emptyForm();
  private isLoading = true;
  private isSubmitting = false;
  private errorMessage: string | null = null;
  private didSubmit = false;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): QuickAddExpenseViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.loadDefaults();
  }

  stop(): void {}

  reset(): void {
    this.form = this.defaultForm();
    this.errorMessage = null;
    this.didSubmit = false;
    this.refresh();
  }

  setAmount(value: string): void {
    this.form = { ...this.form, amount: value };
    this.errorMessage = null;
    this.refresh();
  }

  setAccountId(value: string): void {
    this.form = { ...this.form, accountId: value, currency: pickDefaultCurrency(this.accounts, value) };
    this.errorMessage = null;
    this.refresh();
  }

  setCategoryId(value: string): void {
    this.form = { ...this.form, categoryId: value };
    this.errorMessage = null;
    this.refresh();
  }

  setDescription(value: string): void {
    this.form = { ...this.form, description: value };
    this.errorMessage = null;
    this.refresh();
  }

  async submit(): Promise<boolean> {
    const validationError = validateQuickAdd(this.form);
    if (validationError) {
      this.errorMessage = validationError;
      this.refresh();
      return false;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.refresh();
    try {
      const description = this.form.description.trim();
      await this.core.execute(
        new CreateTransaction({
          type: "expense",
          amount: this.form.amount,
          currency: this.form.currency,
          accountId: this.form.accountId,
          categoryId: this.form.categoryId || null,
          description: description === "" ? null : description,
          date: this.form.date,
          tags: [],
        }),
      );
      this.didSubmit = true;
      this.form = this.defaultForm();
      this.refresh();
      return true;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : "No se pudo guardar el gasto";
      return false;
    } finally {
      this.isSubmitting = false;
      this.refresh();
    }
  }

  private async loadDefaults(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      const [accounts, categories, recent] = await Promise.all([
        this.core.execute(new GetAccounts()),
        this.core.execute(new GetCategories()),
        this.core.execute(new GetTransactions(RECENT_EXPENSES_FILTER)),
      ]);
      this.accounts = accounts;
      this.categories = categories;
      this.recentTransactions = recent.transactions;
      this.form = this.defaultForm();
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private defaultForm(): QuickAddFormState {
    const accountId = pickDefaultAccountId(this.accounts, this.recentTransactions);
    const categoryId = pickDefaultCategoryId(this.categories, this.recentTransactions);
    return {
      amount: "",
      accountId,
      categoryId,
      currency: pickDefaultCurrency(this.accounts, accountId),
      description: "",
      date: getTodayISO(),
    };
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): QuickAddExpenseViewModel {
    const expenseCategories = this.categories.filter((category) => category.type === "expense");
    return {
      title: "Gasto rápido",
      form: {
        amount: this.form.amount,
        accountId: this.form.accountId,
        categoryId: this.form.categoryId,
        currency: this.form.currency,
        description: this.form.description,
      },
      accountOptions: this.accounts.map((account) => ({
        value: account.id,
        label: `${account.name} (${account.currency})`,
      })),
      categoryOptions: expenseCategories.map((category) => ({
        value: category.id,
        label: `${category.icon ? `${category.icon} ` : ""}${category.name}`,
      })),
      isReady: !this.isLoading,
      isSubmitting: this.isSubmitting,
      errorMessage: this.errorMessage,
      submitLabel: this.isSubmitting ? "Guardando..." : "Guardar gasto",
      didSubmit: this.didSubmit,
    };
  }
}
