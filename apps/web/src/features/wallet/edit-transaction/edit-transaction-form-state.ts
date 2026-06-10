import type { Transaction } from "@/lib/api/types";
import {
  validateTransactionFields,
  type TransactionFieldError,
} from "../transaction-form-validation";

export interface EditTransactionFormState {
  amount: string;
  categoryId: string;
  description: string;
  date: string;
  accountId: string;
}

export type EditTransactionFormError = TransactionFieldError;

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
  return validateTransactionFields({
    amount: form.amount,
    accountId: form.accountId,
    date: form.date,
  });
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
