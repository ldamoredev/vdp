import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { Currency } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { CreateTransaction } from "@/core/app/wallet/CreateTransaction";
import { GetAccounts } from "@/core/app/wallet/GetAccounts";
import { GetCategories } from "@/core/app/wallet/GetCategories";
import type { Account } from "@/core/domain/wallet/Account";
import type { Category } from "@/core/domain/wallet/Category";
import type { TransactionType } from "@/core/domain/wallet/Transaction";
import { getTodayISO } from "@/lib/format";
import type {
  NewTransactionFormField,
  NewTransactionFormVM,
  TransactionFormViewModel,
} from "@/ui/models/wallet/TransactionsViewModel";
import { walletScreenIntro } from "../wallet-copy";

interface TransactionFormState {
  type: TransactionType;
  amount: string;
  currency: Currency;
  accountId: string;
  categoryId: string;
  description: string;
  date: string;
  tags: string;
}

export interface TransactionFormPrefill {
  type?: TransactionType;
  amount?: string;
  currency?: Currency;
  description?: string;
}

const TYPE_OPTIONS = [
  { value: "expense", label: "Gasto", tone: "expense" },
  { value: "income", label: "Ingreso", tone: "income" },
  { value: "transfer", label: "Transferencia", tone: "transfer" },
] as const;

const CURRENCY_OPTIONS = [
  { value: "ARS", label: "ARS" },
  { value: "USD", label: "USD" },
];

function emptyForm(): TransactionFormState {
  return {
    type: "expense",
    amount: "",
    currency: "ARS",
    accountId: "",
    categoryId: "",
    description: "",
    date: getTodayISO(),
    tags: "",
  };
}

function validateTransactionFields(fields: {
  amount: string;
  accountId: string;
  date: string;
}): string | null {
  if (fields.amount.trim() === "") return "Ingresá un monto";
  const numericAmount = Number(fields.amount);
  if (Number.isNaN(numericAmount)) return "El monto no es un número válido";
  if (numericAmount <= 0) return "El monto debe ser mayor a cero";
  if (fields.date.trim() === "") return "Ingresá una fecha";
  if (fields.accountId.trim() === "") return "Elegí una cuenta";
  return null;
}

function definedPrefill(prefill: TransactionFormPrefill): Partial<TransactionFormState> {
  const result: Partial<TransactionFormState> = {};
  if (prefill.type !== undefined) result.type = prefill.type;
  if (prefill.amount !== undefined) result.amount = prefill.amount;
  if (prefill.currency !== undefined) result.currency = prefill.currency;
  if (prefill.description !== undefined) result.description = prefill.description;
  return result;
}

export class TransactionFormPresenter extends PresenterBase<TransactionFormViewModel> {
  private accounts: Account[] = [];
  private categories: Category[] = [];
  private form = emptyForm();
  private isSubmitting = false;
  private errorMessage: string | null = null;
  private didSubmit = false;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
    private readonly prefill: TransactionFormPrefill = {},
  ) {
    super(onChange);
    this.form = { ...this.form, ...definedPrefill(prefill) };
  }

  protected initModel(): TransactionFormViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.loadOptions();
  }

  stop(): void {}

  setFormField(field: NewTransactionFormField, value: string): void {
    if (field === "type") {
      this.form = { ...this.form, type: value as TransactionType, categoryId: "" };
    } else if (field === "currency") {
      this.form = { ...this.form, currency: value as Currency };
    } else {
      this.form = { ...this.form, [field]: value };
    }
    this.errorMessage = null;
    this.refresh();
  }

  async submit(): Promise<void> {
    const accountId = this.form.accountId || this.accounts[0]?.id || "";
    const validationError = validateTransactionFields({
      amount: this.form.amount,
      accountId,
      date: this.form.date,
    });
    if (validationError) {
      this.errorMessage = validationError;
      this.refresh();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.refresh();
    try {
      const description = this.form.description.trim();
      await this.core.execute(
        new CreateTransaction({
          type: this.form.type,
          amount: this.form.amount,
          currency: this.form.currency,
          accountId,
          categoryId: this.form.categoryId || null,
          description: description === "" ? null : description,
          date: this.form.date,
          tags: this.form.tags
            ? this.form.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
            : [],
        }),
      );
      this.didSubmit = true;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : "No se pudo guardar";
    } finally {
      this.isSubmitting = false;
      this.refresh();
    }
  }

  private async loadOptions(): Promise<void> {
    try {
      const [accounts, categories] = await Promise.all([
        this.core.execute(new GetAccounts()),
        this.core.execute(new GetCategories()),
      ]);
      this.accounts = accounts;
      this.categories = categories;
      if (!this.form.accountId && accounts[0]) {
        const defaultAccount = this.prefill.currency
          ? accounts.find((account) => account.currency === this.prefill.currency) ?? accounts[0]
          : accounts[0];
        this.form = {
          ...this.form,
          accountId: defaultAccount.id,
          currency: defaultAccount.currency,
        };
      }
    } finally {
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): TransactionFormViewModel {
    return {
      backHref: "/wallet/transactions",
      backLabel: "Volver a transacciones",
      title: "Nueva transacción",
      intro: walletScreenIntro("transactions"),
      form: this.formVM(),
      accounts: this.accounts.map((account) => ({
        value: account.id,
        label: `${account.name} (${account.currency})`,
      })),
      categories: this.categories
        .filter((category) => this.form.type === "transfer" || category.type === this.form.type)
        .map((category) => ({
          value: category.id,
          label: `${category.icon ? `${category.icon} ` : ""}${category.name}`,
        })),
      typeOptions: [...TYPE_OPTIONS],
      currencyOptions: CURRENCY_OPTIONS,
      submitLabel: this.isSubmitting ? "Guardando..." : "Guardar",
      isSubmitting: this.isSubmitting,
      errorMessage: this.errorMessage,
      didSubmit: this.didSubmit,
    };
  }

  private formVM(): NewTransactionFormVM {
    return {
      ...this.form,
      showCategory: this.form.type !== "transfer",
    };
  }
}
