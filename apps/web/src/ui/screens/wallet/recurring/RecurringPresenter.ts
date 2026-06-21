import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { Currency } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { CreateRecurringTransaction } from "@/core/app/wallet/CreateRecurringTransaction";
import { DeleteRecurringTransaction } from "@/core/app/wallet/DeleteRecurringTransaction";
import { GetAccounts } from "@/core/app/wallet/GetAccounts";
import { GetCategories } from "@/core/app/wallet/GetCategories";
import { GetRecurringTransactions } from "@/core/app/wallet/GetRecurringTransactions";
import type { Account } from "@/core/domain/wallet/Account";
import type { Category } from "@/core/domain/wallet/Category";
import type { RecurringTransaction } from "@/core/domain/wallet/RecurringTransaction";
import { formatMoney, getTodayISO } from "@/lib/format";
import type {
  RecurringFormField,
  RecurringRowVM,
  RecurringViewModel,
} from "@/ui/models/wallet/RecurringViewModel";

interface RecurringFormState {
  accountId: string;
  categoryId: string;
  type: "expense" | "income";
  amount: string;
  description: string;
  dayOfMonth: string;
  startDate: string;
  endDate: string;
}

function emptyForm(): RecurringFormState {
  return {
    accountId: "",
    categoryId: "",
    type: "expense",
    amount: "",
    description: "",
    dayOfMonth: "1",
    startDate: getTodayISO(),
    endDate: "",
  };
}

/**
 * Drives the recurring-rules screen (D1c): list, create and delete rules. The
 * actual transactions are materialized lazily on the wallet dashboard load.
 */
export class RecurringPresenter extends PresenterBase<RecurringViewModel> {
  private rules: RecurringTransaction[] = [];
  private accounts: Account[] = [];
  private categories: Category[] = [];
  private isLoading = true;
  private error = false;

  private showForm = false;
  private form: RecurringFormState = emptyForm();
  private isCreating = false;
  private busyIds = new Set<string>();

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): RecurringViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
  }

  stop(): void {}

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.form = emptyForm();
    this.refresh();
  }

  setFormField(field: RecurringFormField, value: string): void {
    if (field === "type") this.form.type = value === "income" ? "income" : "expense";
    else this.form[field] = value;
    this.refresh();
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.isCreating = true;
    this.refresh();
    try {
      await this.core.execute(
        new CreateRecurringTransaction({
          accountId: this.form.accountId,
          categoryId: this.form.categoryId || null,
          type: this.form.type,
          amount: this.form.amount.trim(),
          currency: this.accountCurrency(this.form.accountId),
          description: this.form.description.trim() || null,
          dayOfMonth: Number(this.form.dayOfMonth),
          startDate: this.form.startDate,
          endDate: this.form.endDate || null,
        }),
      );
      this.showForm = false;
      this.form = emptyForm();
      await this.load();
    } finally {
      this.isCreating = false;
      this.refresh();
    }
  }

  async deleteRule(id: string): Promise<void> {
    if (this.busyIds.has(id)) return;
    this.busyIds.add(id);
    this.refresh();
    try {
      await this.core.execute(new DeleteRecurringTransaction(id));
      await this.load();
    } finally {
      this.busyIds.delete(id);
      this.refresh();
    }
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      const [rules, accounts, categories] = await Promise.all([
        this.core.execute(new GetRecurringTransactions()),
        this.core.execute(new GetAccounts()),
        this.core.execute(new GetCategories()),
      ]);
      this.rules = rules;
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

  private canSubmit(): boolean {
    const day = Number(this.form.dayOfMonth);
    return (
      this.form.accountId.trim() !== "" &&
      this.form.amount.trim() !== "" &&
      Number(this.form.amount) > 0 &&
      Number.isInteger(day) &&
      day >= 1 &&
      day <= 31 &&
      this.form.startDate.trim() !== "" &&
      !this.isCreating
    );
  }

  private accountCurrency(accountId: string): Currency {
    return this.accounts.find((account) => account.id === accountId)?.currency ?? "ARS";
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): RecurringViewModel {
    const expenseCategories = this.categories.filter((category) => category.type === this.form.type);
    return {
      title: "Gastos recurrentes",
      intro: "Reglas que crean tus transacciones fijas (alquiler, suscripciones) cada mes, sin que las cargues a mano.",
      addButtonLabel: "Nueva regla",
      form: this.showForm
        ? {
            accountId: this.form.accountId,
            categoryId: this.form.categoryId,
            type: this.form.type,
            amount: this.form.amount,
            description: this.form.description,
            dayOfMonth: this.form.dayOfMonth,
            startDate: this.form.startDate,
            endDate: this.form.endDate,
            accountOptions: this.accounts.map((account) => ({
              value: account.id,
              label: `${account.name} (${account.currency})`,
            })),
            categoryOptions: expenseCategories.map((category) => ({
              value: category.id,
              label: `${category.icon ? `${category.icon} ` : ""}${category.name}`,
            })),
            submitLabel: this.isCreating ? "Creando..." : "Guardar regla",
            isSubmitting: this.isCreating,
            canSubmit: this.canSubmit(),
          }
        : null,
      rules: this.rules.map((rule) => this.ruleVM(rule)),
      isLoading: this.isLoading,
      error: this.error,
      isEmpty: !this.isLoading && !this.error && this.rules.length === 0,
    };
  }

  private ruleVM(rule: RecurringTransaction): RecurringRowVM {
    const account = this.accounts.find((candidate) => candidate.id === rule.accountId);
    const category = this.categories.find((candidate) => candidate.id === rule.categoryId);
    const sign = rule.type === "expense" ? "-" : "+";
    const meta = [account?.name, category?.name ?? "sin categoría"].filter(Boolean).join(" · ");
    return {
      id: rule.id,
      title: rule.description || (rule.type === "expense" ? "Gasto recurrente" : "Ingreso recurrente"),
      amountLabel: `${sign}${formatMoney(Number(rule.amount), rule.currency)}`,
      scheduleLabel: `día ${rule.dayOfMonth} de cada mes`,
      metaLabel: meta,
      toneIsExpense: rule.type === "expense",
      isBusy: this.busyIds.has(rule.id),
    };
  }
}
