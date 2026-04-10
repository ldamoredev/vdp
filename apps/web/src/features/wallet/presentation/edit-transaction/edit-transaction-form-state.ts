import type { Transaction } from "@/lib/api/types";

export interface EditTransactionFormState {
  amount: string;
  categoryId: string;
  description: string;
  date: string;
  accountId: string;
}

export interface EditTransactionFormError {
  field: "amount" | "date" | "accountId";
  message: string;
}

export function buildEditFormFromTransaction(
  transaction: Transaction,
): EditTransactionFormState {
  return {
    amount: transaction.amount,
    categoryId: transaction.categoryId ?? "",
    description: transaction.description ?? "",
    date: transaction.date,
    accountId: transaction.accountId,
  };
}

export function validateEditTransaction(
  form: EditTransactionFormState,
): EditTransactionFormError | null {
  if (form.amount.trim() === "") {
    return { field: "amount", message: "Ingresá un monto" };
  }

  const numericAmount = Number(form.amount);
  if (Number.isNaN(numericAmount)) {
    return { field: "amount", message: "El monto no es un número válido" };
  }

  if (numericAmount <= 0) {
    return { field: "amount", message: "El monto debe ser mayor a cero" };
  }

  if (form.date.trim() === "") {
    return { field: "date", message: "Ingresá una fecha" };
  }

  if (form.accountId.trim() === "") {
    return { field: "accountId", message: "Elegí una cuenta" };
  }

  return null;
}

export function buildUpdatePayload(
  original: Transaction,
  form: EditTransactionFormState,
): Partial<Transaction> | null {
  const payload: Partial<Transaction> = {};

  if (form.amount !== original.amount) {
    payload.amount = form.amount;
  }

  const nextCategoryId = form.categoryId === "" ? null : form.categoryId;
  if (nextCategoryId !== original.categoryId) {
    payload.categoryId = nextCategoryId;
  }

  const nextDescription = form.description.trim();
  const normalizedDescription = nextDescription === "" ? null : nextDescription;
  const originalDescription =
    original.description?.trim() === "" ? null : (original.description ?? null);

  if (normalizedDescription !== originalDescription) {
    payload.description = normalizedDescription;
  }

  if (form.date !== original.date) {
    payload.date = form.date;
  }

  if (form.accountId !== original.accountId) {
    payload.accountId = form.accountId;
  }

  return Object.keys(payload).length === 0 ? null : payload;
}
