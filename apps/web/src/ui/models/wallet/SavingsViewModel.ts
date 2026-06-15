import type { Currency } from "@vdp/shared";
import type { SelectOptionVM, WalletEmptyStateVM } from "./common";

export interface SavingsViewModel {
  title: string;
  intro: string;
  addButtonLabel: string;
  form: SavingsFormVM | null;
  goals: SavingsGoalVM[];
  emptyState: WalletEmptyStateVM | null;
  isLoading: boolean;
  error: boolean;
}

export type SavingsFormField = "name" | "targetAmount" | "currency" | "deadline";

export interface SavingsFormVM {
  name: string;
  targetAmount: string;
  currency: Currency;
  deadline: string;
  currencyOptions: SelectOptionVM[];
  submitLabel: string;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export interface SavingsGoalVM {
  id: string;
  name: string;
  isCompleted: boolean;
  hasDeadline: boolean;
  deadlineLabel: string;
  currentLabel: string;
  targetLabel: string;
  progressPercent: number;
  progressLabel: string;
  accumulatedLabel: string;
  isContributing: boolean;
  contributeAmount: string;
  isSubmittingContribution: boolean;
  canSubmitContribution: boolean;
}
