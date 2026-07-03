import type { Currency, LoanDirection } from "@vdp/shared";

import type { WalletEmptyStateVM } from "./common";

export type LoanFormField = "counterparty" | "principal" | "date" | "dueDate" | "note";

export interface LoanSummaryVM {
  currency: string;
  /** Outstanding that others owe you (open loans you made). */
  lentLabel: string;
  /** Outstanding you still owe (open loans you took). */
  borrowedLabel: string;
}

export interface LoanFormVM {
  direction: LoanDirection;
  counterparty: string;
  principal: string;
  currency: Currency;
  date: string;
  dueDate: string;
  note: string;
  currencyOptions: { value: string; label: string }[];
  submitLabel: string;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export interface LoanCardVM {
  id: string;
  directionLabel: string;
  counterparty: string;
  principalLabel: string;
  outstandingLabel: string;
  paidLabel: string;
  statusLabel: string;
  isOpen: boolean;
  dateLabel: string;
  dueLabel: string | null;
  note: string | null;
  paymentsLabel: string | null;
  // Inline payment registration
  isPaying: boolean;
  paymentAmount: string;
  isSubmittingPayment: boolean;
  canSubmitPayment: boolean;
  // repay / forgive in flight
  isBusy: boolean;
}

export interface LoansViewModel {
  title: string;
  intro: string;
  addButtonLabel: string;
  summary: LoanSummaryVM[];
  form: LoanFormVM | null;
  openLoans: LoanCardVM[];
  closedLoans: LoanCardVM[];
  emptyState: WalletEmptyStateVM | null;
  isLoading: boolean;
  error: boolean;
}
