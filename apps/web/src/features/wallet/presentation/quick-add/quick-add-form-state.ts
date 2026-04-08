import type { Currency } from "@/lib/api/types";

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

export interface CreateTransactionPayload {
  type: "expense";
  amount: string;
  currency: Currency;
  accountId: string;
  categoryId: string | null;
  description: string | null;
  date: string;
  tags: string[];
}

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
  if (form.amount.trim() === "") return "Ingresá un monto";
  const numericAmount = Number(form.amount);
  if (Number.isNaN(numericAmount)) return "El monto no es un número válido";
  if (numericAmount <= 0) return "El monto debe ser mayor a cero";
  if (form.accountId.trim() === "") return "Elegí una cuenta";
  return null;
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
