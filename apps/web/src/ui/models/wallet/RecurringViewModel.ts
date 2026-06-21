export type RecurringFormField =
  | "accountId"
  | "categoryId"
  | "type"
  | "amount"
  | "description"
  | "dayOfMonth"
  | "startDate"
  | "endDate";

export interface RecurringOption {
  value: string;
  label: string;
}

export interface RecurringFormVM {
  accountId: string;
  categoryId: string;
  type: "expense" | "income";
  amount: string;
  description: string;
  dayOfMonth: string;
  startDate: string;
  endDate: string;
  accountOptions: RecurringOption[];
  categoryOptions: RecurringOption[];
  submitLabel: string;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export interface RecurringRowVM {
  id: string;
  title: string;
  amountLabel: string;
  scheduleLabel: string;
  metaLabel: string;
  toneIsExpense: boolean;
  isBusy: boolean;
}

export interface RecurringViewModel {
  title: string;
  intro: string;
  addButtonLabel: string;
  form: RecurringFormVM | null;
  rules: RecurringRowVM[];
  isLoading: boolean;
  error: boolean;
  isEmpty: boolean;
}
