import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { Currency, LoanDirection } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { CreateLoan } from "@/core/app/wallet/CreateLoan";
import { ForgiveLoan } from "@/core/app/wallet/ForgiveLoan";
import { GetLoans } from "@/core/app/wallet/GetLoans";
import { MarkLoanRepaid } from "@/core/app/wallet/MarkLoanRepaid";
import { RegisterLoanPayment } from "@/core/app/wallet/RegisterLoanPayment";
import {
  Loan,
  sortLoans,
  summarizeOutstandingByCurrency,
} from "@/core/domain/wallet/Loan";
import { formatDate, formatMoney, getTodayISO } from "@/lib/format";
import type { LoanCardVM, LoanFormField, LoansViewModel } from "@/ui/models/wallet/LoansViewModel";
import { walletEmptyState, walletScreenIntro } from "../wallet-copy";

interface LoanFormState {
  direction: LoanDirection;
  counterparty: string;
  principal: string;
  currency: Currency;
  date: string;
  dueDate: string;
  note: string;
}

const CURRENCY_OPTIONS = [
  { value: "ARS", label: "ARS" },
  { value: "USD", label: "USD" },
];

const STATUS_LABELS: Record<Loan["status"], string> = {
  open: "Abierto",
  repaid: "Saldado",
  forgiven: "Perdonado",
};

function emptyForm(): LoanFormState {
  return {
    direction: "lent",
    counterparty: "",
    principal: "",
    currency: "ARS",
    date: getTodayISO(),
    dueDate: "",
    note: "",
  };
}

/**
 * Drives the loans screen: loads loans, owns the create form, the per-currency
 * outstanding summary, the open/closed split, and per-loan actions (inline
 * payment, mark repaid, forgive). Mutations go through the Core bus and reload.
 * Spanish copy lives here; the view is humble.
 */
export class LoansPresenter extends PresenterBase<LoansViewModel> {
  private loans: Loan[] = [];
  private isLoading = true;
  private error = false;

  private showForm = false;
  private form: LoanFormState = emptyForm();
  private isCreating = false;

  private payingId: string | null = null;
  private paymentAmount = "";
  private isSubmittingPayment = false;

  private busyLoanId: string | null = null;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): LoansViewModel {
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

  setDirection(direction: LoanDirection): void {
    this.form.direction = direction;
    this.refresh();
  }

  setFormField(field: LoanFormField, value: string): void {
    this.form[field] = value;
    this.refresh();
  }

  setFormCurrency(currency: Currency): void {
    this.form.currency = currency;
    this.refresh();
  }

  async submit(): Promise<void> {
    if (!this.canSubmitForm()) return;
    this.isCreating = true;
    this.refresh();
    try {
      await this.core.execute(
        new CreateLoan({
          direction: this.form.direction,
          counterparty: this.form.counterparty.trim(),
          principal: this.form.principal,
          currency: this.form.currency,
          date: this.form.date,
          dueDate: this.form.dueDate || null,
          note: this.form.note.trim() || null,
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

  startPayment(loanId: string): void {
    this.payingId = loanId;
    this.paymentAmount = "";
    this.refresh();
  }

  cancelPayment(): void {
    this.payingId = null;
    this.paymentAmount = "";
    this.refresh();
  }

  setPaymentAmount(value: string): void {
    this.paymentAmount = value;
    this.refresh();
  }

  async submitPayment(): Promise<void> {
    if (!this.payingId || !this.canSubmitPayment() || this.isSubmittingPayment) return;
    const id = this.payingId;
    this.isSubmittingPayment = true;
    this.refresh();
    try {
      await this.core.execute(
        new RegisterLoanPayment(id, { amount: this.paymentAmount, date: getTodayISO() }),
      );
      this.payingId = null;
      this.paymentAmount = "";
      await this.load();
    } finally {
      this.isSubmittingPayment = false;
      this.refresh();
    }
  }

  async markRepaid(loanId: string): Promise<void> {
    await this.runLoanAction(loanId, new MarkLoanRepaid(loanId));
  }

  async forgive(loanId: string): Promise<void> {
    await this.runLoanAction(loanId, new ForgiveLoan(loanId));
  }

  private async runLoanAction(loanId: string, command: MarkLoanRepaid | ForgiveLoan): Promise<void> {
    if (this.busyLoanId) return;
    this.busyLoanId = loanId;
    this.refresh();
    try {
      await this.core.execute(command);
      await this.load();
    } finally {
      this.busyLoanId = null;
      this.refresh();
    }
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      this.loans = await this.core.execute(new GetLoans());
      this.error = false;
    } catch {
      this.error = true;
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private canSubmitForm(): boolean {
    return (
      this.form.counterparty.trim().length > 0 &&
      Number(this.form.principal) > 0 &&
      this.form.date.length > 0 &&
      !this.isCreating
    );
  }

  private canSubmitPayment(): boolean {
    return Number(this.paymentAmount) > 0;
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): LoansViewModel {
    const sorted = sortLoans(this.loans);
    return {
      title: "Préstamos",
      intro: walletScreenIntro("loans"),
      addButtonLabel: "Nuevo préstamo",
      summary: summarizeOutstandingByCurrency(this.loans).map((entry) => ({
        currency: entry.currency,
        lentLabel: formatMoney(entry.lentOutstanding, entry.currency),
        borrowedLabel: formatMoney(entry.borrowedOutstanding, entry.currency),
      })),
      form: this.showForm
        ? {
            direction: this.form.direction,
            counterparty: this.form.counterparty,
            principal: this.form.principal,
            currency: this.form.currency,
            date: this.form.date,
            dueDate: this.form.dueDate,
            note: this.form.note,
            currencyOptions: CURRENCY_OPTIONS,
            submitLabel: this.isCreating ? "Guardando..." : "Registrar préstamo",
            isSubmitting: this.isCreating,
            canSubmit: this.canSubmitForm(),
          }
        : null,
      openLoans: sorted.filter((loan) => loan.isOpen).map((loan) => this.cardVM(loan)),
      closedLoans: sorted.filter((loan) => !loan.isOpen).map((loan) => this.cardVM(loan)),
      emptyState: !this.isLoading && this.loans.length === 0 ? walletEmptyState("loans") : null,
      isLoading: this.isLoading,
      error: this.error,
    };
  }

  private cardVM(loan: Loan): LoanCardVM {
    const currency = loan.currency;
    const isPaying = this.payingId === loan.id;
    return {
      id: loan.id,
      directionLabel: loan.direction === "lent" ? "Prestado a" : "Pedido a",
      counterparty: loan.counterparty,
      principalLabel: formatMoney(loan.principal, currency),
      outstandingLabel: formatMoney(loan.outstanding, currency),
      paidLabel: formatMoney(loan.paidTotal, currency),
      statusLabel: STATUS_LABELS[loan.status],
      isOpen: loan.isOpen,
      dateLabel: formatDate(loan.date),
      dueLabel: loan.dueDate ? formatDate(loan.dueDate) : null,
      note: loan.note,
      paymentsLabel:
        loan.payments.length > 0
          ? `${loan.payments.length} pago${loan.payments.length === 1 ? "" : "s"}`
          : null,
      isPaying,
      paymentAmount: isPaying ? this.paymentAmount : "",
      isSubmittingPayment: isPaying && this.isSubmittingPayment,
      canSubmitPayment: isPaying && this.canSubmitPayment(),
      isBusy: this.busyLoanId === loan.id,
    };
  }
}
