"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { walletApi } from "@/features/wallet/wallet-api";
import { getTodayISO } from "@/lib/format";
import type { Category, TransactionType } from "@/lib/api/types";
import {
  type TransactionFormState,
} from "./wallet-selectors";
import { walletQueryKeys } from "./wallet-query-keys";
import { validateTransactionFields } from "./transaction-form-validation";

function createInitialTransactionForm(): TransactionFormState {
  return {
    type: "expense",
    amount: "",
    currency: "ARS",
    accountId: "",
    categoryId: "",
    description: "",
    date: getTodayISO(),
    tags: "",
  };
}

export function useWalletTransactionCreation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TransactionFormState>(
    createInitialTransactionForm(),
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const accountsQuery = useQuery({
    queryKey: walletQueryKeys.accounts,
    queryFn: walletApi.getAccounts,
  });

  const categoriesQuery = useQuery({
    queryKey: walletQueryKeys.categories,
    queryFn: () => walletApi.getCategories(),
  });

  const mutation = useMutation({
    mutationFn: walletApi.createTransaction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: walletQueryKeys.all });
      router.push("/wallet/transactions");
    },
  });

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (category: Category) =>
          form.type === "transfer" || category.type === form.type,
      ),
    [categories, form.type],
  );

  async function submitTransaction() {
    const accountId = form.accountId || accountsQuery.data?.[0]?.id || "";
    const error = validateTransactionFields({
      amount: form.amount,
      accountId,
      date: form.date,
    });
    if (error !== null) {
      setValidationError(error.message);
      return;
    }
    setValidationError(null);

    try {
      await mutation.mutateAsync({
        ...form,
        accountId,
        categoryId: form.categoryId || null,
        tags: form.tags
          ? form.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : [],
      });
    } catch {
      // El mensaje ya queda expuesto via mutation.error / errorMessage.
    }
  }

  return {
    accounts: accountsQuery.data ?? [],
    categories,
    filteredCategories,
    form,
    isLoadingAccounts: accountsQuery.isLoading,
    isLoadingCategories: categoriesQuery.isLoading,
    isSubmitting: mutation.isPending,
    errorMessage:
      validationError ??
      (mutation.error instanceof Error ? mutation.error.message : null),
    setFormField: (field: keyof TransactionFormState, value: string) =>
      setForm((current) => ({
        ...current,
        [field]:
          field === "type"
            ? (value as TransactionType)
            : field === "currency"
              ? (value as TransactionFormState["currency"])
              : value,
      })),
    submitTransaction,
    cancel: () => router.back(),
  };
}
