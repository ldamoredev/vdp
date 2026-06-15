import type { AccountType } from "@/core/domain/wallet/Account";
import type { Currency } from "@vdp/shared";

export interface AccountsViewModel {
  title: string;
  intro: string;
  addButtonLabel: string;
  form: AccountFormVM | null;
  accounts: AccountItemVM[];
  emptyState: WalletEmptyStateVM | null;
  isLoading: boolean;
  error: boolean;
}

export type AccountFormField = "name" | "type" | "currency" | "initialBalance";

export interface AccountFormVM {
  name: string;
  type: AccountType;
  currency: Currency;
  initialBalance: string;
  typeOptions: SelectOptionVM[];
  currencyOptions: SelectOptionVM[];
  submitLabel: string;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export interface SelectOptionVM {
  value: string;
  label: string;
}

export interface AccountItemVM {
  id: string;
  name: string;
  metaLabel: string;
  currentBalanceLabel: string;
  initialBalanceLabel: string;
  isEditing: boolean;
  editingName: string;
  isBusy: boolean;
}

export interface WalletEmptyStateVM {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}
