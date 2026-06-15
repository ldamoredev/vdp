import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { Currency } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { CreateInvestment } from "@/core/app/wallet/CreateInvestment";
import { GetAccounts } from "@/core/app/wallet/GetAccounts";
import { GetInvestments } from "@/core/app/wallet/GetInvestments";
import { UpdateInvestment } from "@/core/app/wallet/UpdateInvestment";
import type { Account } from "@/core/domain/wallet/Account";
import {
  type Investment,
  type InvestmentType,
  buildInvestmentSummary,
} from "@/core/domain/wallet/Investment";
import { formatMoney } from "@/lib/format";
import type {
  InvestmentFormField,
  InvestmentItemVM,
  InvestmentSummaryVM,
  InvestmentsViewModel,
} from "@/ui/models/wallet/InvestmentsViewModel";
import { INVESTMENT_TYPE_LABELS, walletEmptyState, walletScreenIntro } from "../wallet-copy";

interface InvestmentFormState {
  name: string;
  type: InvestmentType;
  accountId: string;
  currency: Currency;
  investedAmount: string;
  currentValue: string;
  startDate: string;
  endDate: string;
  rate: string;
  notes: string;
}

const TYPE_OPTIONS = Object.entries(INVESTMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const CURRENCY_OPTIONS = [
  { value: "ARS", label: "ARS" },
  { value: "USD", label: "USD" },
];

function emptyForm(today: string): InvestmentFormState {
  return {
    name: "",
    type: "plazo_fijo",
    accountId: "",
    currency: "ARS",
    investedAmount: "",
    currentValue: "",
    startDate: today,
    endDate: "",
    rate: "",
    notes: "",
  };
}

/**
 * Drives the investments screen: loads positions + accounts, rolls returns up
 * per currency (never across ARS/USD) via the domain buildInvestmentSummary,
 * owns the create form and the per-position valuation edit. Mutations go through
 * the Core bus and reload. Spanish copy lives here; the view is humble.
 */
export class InvestmentsPresenter extends PresenterBase<InvestmentsViewModel> {
  private investments: Investment[] = [];
  private accounts: Account[] = [];
  private isLoading = true;
  private error = false;

  private showForm = false;
  private form: InvestmentFormState;
  private isCreating = false;

  private editingId: string | null = null;
  private editingCurrentValue = "";
  private editingRate = "";
  private editingNotes = "";
  private busyIds = new Set<string>();

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
    private readonly today: string,
  ) {
    super(onChange);
    this.form = emptyForm(today);
  }

  protected initModel(): InvestmentsViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
  }

  stop(): void {}

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.form = emptyForm(this.today);
    this.refresh();
  }

  setFormField(field: InvestmentFormField, value: string): void {
    if (field === "type") this.form.type = value as InvestmentType;
    else if (field === "currency") this.form.currency = value as Currency;
    else this.form[field] = value;
    this.refresh();
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.isCreating = true;
    this.refresh();
    try {
      await this.core.execute(
        new CreateInvestment({
          name: this.form.name.trim(),
          type: this.form.type,
          accountId: this.form.accountId || null,
          currency: this.form.currency,
          investedAmount: this.form.investedAmount,
          currentValue: this.form.currentValue || this.form.investedAmount,
          startDate: this.form.startDate,
          endDate: this.form.endDate || null,
          rate: this.form.rate || null,
          notes: this.form.notes || null,
        }),
      );
      this.showForm = false;
      this.form = emptyForm(this.today);
      await this.load();
    } finally {
      this.isCreating = false;
      this.refresh();
    }
  }

  startEdit(id: string): void {
    const investment = this.investments.find((item) => item.id === id);
    if (!investment) return;
    this.editingId = id;
    this.editingCurrentValue = investment.currentValue;
    this.editingRate = investment.rate ?? "";
    this.editingNotes = investment.notes ?? "";
    this.refresh();
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editingCurrentValue = "";
    this.editingRate = "";
    this.editingNotes = "";
    this.refresh();
  }

  setEditField(field: "currentValue" | "rate" | "notes", value: string): void {
    if (field === "currentValue") this.editingCurrentValue = value;
    else if (field === "rate") this.editingRate = value;
    else this.editingNotes = value;
    this.refresh();
  }

  async saveEdit(): Promise<void> {
    const id = this.editingId;
    if (!id || this.editingCurrentValue.trim().length === 0) return;
    await this.runForId(id, async () => {
      await this.core.execute(
        new UpdateInvestment(id, {
          currentValue: this.editingCurrentValue,
          rate: this.editingRate || null,
          notes: this.editingNotes || null,
        }),
      );
      this.cancelEditState();
      await this.load();
    });
  }

  private cancelEditState(): void {
    this.editingId = null;
    this.editingCurrentValue = "";
    this.editingRate = "";
    this.editingNotes = "";
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      const [investments, accounts] = await Promise.all([
        this.core.execute(new GetInvestments()),
        this.core.execute(new GetAccounts()),
      ]);
      this.investments = investments;
      this.accounts = accounts;
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

  private canSubmit(): boolean {
    return (
      this.form.name.trim().length > 0 &&
      this.form.investedAmount.trim().length > 0 &&
      this.form.startDate.trim().length > 0 &&
      !this.isCreating
    );
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): InvestmentsViewModel {
    const hasInvestments = this.investments.length > 0;

    return {
      title: "Inversiones",
      intro: walletScreenIntro("investments"),
      addButtonLabel: "Nueva inversion",
      summaries: hasInvestments ? this.summaryVMs() : [],
      form: this.showForm ? this.formVM() : null,
      investments: this.investments.map((investment) => this.investmentVM(investment)),
      emptyState: !this.isLoading && !hasInvestments ? walletEmptyState("investments") : null,
      isLoading: this.isLoading,
      error: this.error,
    };
  }

  private summaryVMs(): InvestmentSummaryVM[] {
    return buildInvestmentSummary(this.investments).map((summary) => {
      const currency = summary.currency as "ARS" | "USD";
      return {
        currency: summary.currency,
        totalInvestedLabel: formatMoney(summary.totalInvested, currency),
        totalCurrentLabel: formatMoney(summary.totalCurrent, currency),
        totalReturnLabel: `${summary.totalReturn}%`,
        positive: summary.positive,
      };
    });
  }

  private formVM(): NonNullable<InvestmentsViewModel["form"]> {
    return {
      name: this.form.name,
      type: this.form.type,
      accountId: this.form.accountId,
      currency: this.form.currency,
      investedAmount: this.form.investedAmount,
      currentValue: this.form.currentValue,
      startDate: this.form.startDate,
      endDate: this.form.endDate,
      rate: this.form.rate,
      notes: this.form.notes,
      typeOptions: TYPE_OPTIONS,
      accountOptions: [
        { value: "", label: "Sin cuenta asociada" },
        ...this.accounts.map((account) => ({ value: account.id, label: account.name })),
      ],
      currencyOptions: CURRENCY_OPTIONS,
      submitLabel: this.isCreating ? "Creando..." : "Crear",
      isSubmitting: this.isCreating,
      canSubmit: this.canSubmit(),
    };
  }

  private investmentVM(investment: Investment): InvestmentItemVM {
    const currency = investment.currency as "ARS" | "USD";
    const positive = investment.current >= investment.invested;
    const returnPct =
      investment.invested > 0
        ? (((investment.current - investment.invested) / investment.invested) * 100).toFixed(1)
        : "0.0";
    const isEditing = this.editingId === investment.id;
    return {
      id: investment.id,
      name: investment.name,
      typeLabel: INVESTMENT_TYPE_LABELS[investment.type] ?? investment.type,
      returnLabel: `${positive ? "+" : ""}${returnPct}%`,
      positive,
      investedLabel: formatMoney(investment.invested, currency),
      currentLabel: formatMoney(investment.current, currency),
      notes: investment.notes,
      isEditing,
      editingCurrentValue: isEditing ? this.editingCurrentValue : "",
      editingRate: isEditing ? this.editingRate : "",
      editingNotes: isEditing ? this.editingNotes : "",
      isSubmittingEdit: isEditing && this.busyIds.has(investment.id),
      canSubmitEdit: isEditing && this.editingCurrentValue.trim().length > 0,
    };
  }
}
