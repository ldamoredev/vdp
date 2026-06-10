import type { CreateTransactionInput } from "@vdp/shared";
import type { Currency } from "@/lib/api/types";
import { validateTransactionFields } from "../transaction-form-validation";

export interface QuickAddFormState {
  amount: string;
  accountId: string;
  categoryId: string;
  currency: Currency;
  description: string;
  date: string;
}

export interface QuickAddDefaults {
  accountId: string;
  categoryId: string;
  currency: Currency;
  todayISO: string;
}

export type CreateTransactionPayload = CreateTransactionInput & {
  type: "expense";
};

export function buildInitialQuickAddForm(
  defaults: QuickAddDefaults,
): QuickAddFormState {
  return {
    amount: "",
    accountId: defaults.accountId,
    categoryId: defaults.categoryId,
    currency: defaults.currency,
    description: "",
    date: defaults.todayISO,
  };
}

export function validateQuickAddForm(form: QuickAddFormState): string | null {
  const error = validateTransactionFields({
    amount: form.amount,
    accountId: form.accountId,
  });
  return error?.message ?? null;
}

export function buildCreateTransactionPayload(
  form: QuickAddFormState,
): CreateTransactionPayload {
  const trimmedDescription = form.description.trim();
  return {
    type: "expense",
    amount: form.amount,
    currency: form.currency,
    accountId: form.accountId,
    categoryId: form.categoryId === "" ? null : form.categoryId,
    description: trimmedDescription === "" ? null : trimmedDescription,
    date: form.date,
    tags: [],
  };
}
