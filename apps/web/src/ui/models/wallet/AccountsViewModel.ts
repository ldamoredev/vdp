import type { AccountType } from "@/core/domain/wallet/Account";
import type { Currency } from "@vdp/shared";
import type { SelectOptionVM, WalletEmptyStateVM } from "./common";

export type { SelectOptionVM, WalletEmptyStateVM };

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
