"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { walletApi } from "@/lib/api/wallet";
import { getTodayISO } from "@/lib/format";
import type { Category, Transaction } from "@/lib/api/types";
import {
  type TransactionFormState,
} from "./wallet-selectors";
import { walletQueryKeys } from "./wallet-query-keys";

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

  const categories = categoriesQuery.data ?? [];
  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (category: Category) =>
          form.type === "transfer" || category.type === form.type,
      ),
    [categories, form.type],
  );

  async function submitTransaction() {
    await mutation.mutateAsync({
      ...form,
      accountId: form.accountId || accountsQuery.data?.[0]?.id || "",
      categoryId: form.categoryId || null,
      tags: form.tags
        ? form.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [],
    });
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
      mutation.error instanceof Error ? mutation.error.message : null,
    setFormField: (field: keyof TransactionFormState, value: string) =>
      setForm((current) => ({
        ...current,
        [field]:
          field === "type"
            ? (value as Transaction["type"])
            : field === "currency"
              ? (value as TransactionFormState["currency"])
              : value,
      })),
    submitTransaction,
    cancel: () => router.back(),
  };
}
