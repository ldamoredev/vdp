import type { Currency } from "@vdp/shared";

import type { InvestmentType } from "@/core/domain/wallet/Investment";
import type { SelectOptionVM, WalletEmptyStateVM } from "./common";

export interface InvestmentsViewModel {
  title: string;
  intro: string;
  addButtonLabel: string;
  summaries: InvestmentSummaryVM[];
  form: InvestmentFormVM | null;
  investments: InvestmentItemVM[];
  emptyState: WalletEmptyStateVM | null;
  isLoading: boolean;
  error: boolean;
}

/** Per-currency rollup. ARS and USD never get merged into one figure. */
export interface InvestmentSummaryVM {
  currency: string;
  totalInvestedLabel: string;
  totalCurrentLabel: string;
  totalReturnLabel: string;
  positive: boolean;
}

export type InvestmentFormField =
  | "name"
  | "type"
  | "accountId"
  | "currency"
  | "investedAmount"
  | "currentValue"
  | "startDate"
  | "endDate"
  | "rate"
  | "notes";

export interface InvestmentFormVM {
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
  typeOptions: SelectOptionVM[];
  accountOptions: SelectOptionVM[];
  currencyOptions: SelectOptionVM[];
  submitLabel: string;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export interface InvestmentItemVM {
  id: string;
  name: string;
  typeLabel: string;
  returnLabel: string;
  positive: boolean;
  investedLabel: string;
  currentLabel: string;
  notes: string | null;
  isEditing: boolean;
  editingCurrentValue: string;
  editingRate: string;
  editingNotes: string;
  isSubmittingEdit: boolean;
  canSubmitEdit: boolean;
}
