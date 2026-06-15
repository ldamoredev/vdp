import type { Currency } from "@vdp/shared";
import type { TransactionType, WalletTransactionFilters } from "@/core/domain/wallet/Transaction";
import type { SelectOptionVM, WalletEmptyStateVM } from "./common";

export type { WalletEmptyStateVM };

export type TransactionTypeFilter = TransactionType | "";

export interface TransactionsViewModel {
  title: string;
  intro: string;
  addButtonLabel: string;
  addHref: string;
  filtersLabel: string;
  filters: TransactionFiltersVM;
  activeCategoryChip: ActiveCategoryChipVM | null;
  sanity: TransactionSanityVM;
  rows: TransactionRowVM[];
  pagination: TransactionPaginationVM;
  editSheet: EditTransactionSheetVM | null;
  emptyState: WalletEmptyStateVM | null;
  isLoading: boolean;
  error: boolean;
}

export interface TransactionFiltersVM {
  type: TransactionTypeFilter;
  from: string;
  to: string;
  typeOptions: SelectOptionVM[];
}

export interface ActiveCategoryChipVM {
  label: string;
}

export interface TransactionSanityVM {
  transactionCount: number;
  totalAmountLabel: string;
  dateRange?: { from: string; to: string };
}

export interface TransactionRowVM {
  id: string;
  dateLabel: string;
  descriptionLabel: string;
  typeLabel: string;
  typeTone: "income" | "expense" | "transfer";
  amountLabel: string;
  amountTone: "income" | "expense" | "transfer";
  isEditable: boolean;
  isBusy: boolean;
}

export interface TransactionPaginationVM {
  show: boolean;
  label: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export type EditTransactionFormField =
  | "amount"
  | "categoryId"
  | "description"
  | "date"
  | "accountId";

export interface EditTransactionSheetVM {
  title: string;
  transactionId: string;
  amount: string;
  currency: Currency;
  accountId: string;
  categoryId: string;
  description: string;
  date: string;
  accountOptions: SelectOptionVM[];
  categoryOptions: SelectOptionVM[];
  message: string | null;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export interface TransactionFormViewModel {
  backHref: string;
  backLabel: string;
  title: string;
  intro: string;
  form: NewTransactionFormVM;
  accounts: SelectOptionVM[];
  categories: SelectOptionVM[];
  typeOptions: TransactionTypeOptionVM[];
  currencyOptions: SelectOptionVM[];
  submitLabel: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  didSubmit: boolean;
}

export interface NewTransactionFormVM {
  type: TransactionType;
  amount: string;
  currency: Currency;
  accountId: string;
  categoryId: string;
  description: string;
  date: string;
  tags: string;
  showCategory: boolean;
}

export interface TransactionTypeOptionVM extends SelectOptionVM {
  value: TransactionType;
  tone: "income" | "expense" | "transfer";
}

export type NewTransactionFormField = keyof Omit<NewTransactionFormVM, "showCategory">;

export type TransactionsInitialFilters = WalletTransactionFilters;

export interface QuickAddExpenseViewModel {
  title: string;
  form: QuickAddExpenseFormVM;
  accountOptions: SelectOptionVM[];
  categoryOptions: SelectOptionVM[];
  isReady: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  submitLabel: string;
  didSubmit: boolean;
}

export interface QuickAddExpenseFormVM {
  amount: string;
  accountId: string;
  categoryId: string;
  currency: Currency;
  description: string;
}
