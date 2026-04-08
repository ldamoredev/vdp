"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { walletApi } from "@/lib/api/wallet";
import { getTodayISO } from "@/lib/format";
import type { Account, Category, Currency, Transaction } from "@/lib/api/types";
import { walletQueryKeys } from "../wallet-query-keys";
import {
  pickDefaultAccountId,
  pickDefaultCategoryId,
  pickDefaultCurrency,
} from "./quick-add-defaults";
import {
  buildCreateTransactionPayload,
  buildInitialQuickAddForm,
  validateQuickAddForm,
  type QuickAddFormState,
} from "./quick-add-form-state";

const RECENT_TRANSACTIONS_QUERY_PARAMS = { limit: "20", type: "expense" };

export interface UseQuickAddExpenseResult {
  readonly accounts: Account[];
  readonly expenseCategories: Category[];
  readonly form: QuickAddFormState;
  readonly isReady: boolean;
  readonly isSubmitting: boolean;
  readonly errorMessage: string | null;
  readonly setAmount: (value: string) => void;
  readonly setAccountId: (value: string) => void;
  readonly setCategoryId: (value: string) => void;
  readonly setDescription: (value: string) => void;
  readonly submit: () => Promise<boolean>;
  readonly reset: () => void;
}

export function useQuickAddExpense(): UseQuickAddExpenseResult {
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: walletQueryKeys.accounts,
    queryFn: walletApi.getAccounts,
  });
  const categoriesQuery = useQuery({
    queryKey: walletQueryKeys.categories,
    queryFn: () => walletApi.getCategories(),
  });
  const recentQuery = useQuery({
    queryKey: [...walletQueryKeys.recentTransactions, "quick-add"] as const,
    queryFn: () => walletApi.getTransactions(RECENT_TRANSACTIONS_QUERY_PARAMS),
  });

  const accounts: Account[] = accountsQuery.data ?? [];
  const categories: Category[] = categoriesQuery.data ?? [];
  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === "expense"),
    [categories],
  );
  const recentTransactions: Transaction[] = useMemo(
    () => recentQuery.data?.transactions ?? [],
    [recentQuery.data],
  );

  const isReady =
    !accountsQuery.isLoading &&
    !categoriesQuery.isLoading &&
    !recentQuery.isLoading;

  const defaultAccountId = useMemo(
    () => pickDefaultAccountId(accounts, recentTransactions),
    [accounts, recentTransactions],
  );
  const defaultCategoryId = useMemo(
    () => pickDefaultCategoryId(categories, recentTransactions),
    [categories, recentTransactions],
  );
  const defaultCurrency: Currency = useMemo(
    () => pickDefaultCurrency(accounts, defaultAccountId),
    [accounts, defaultAccountId],
  );

  const [form, setForm] = useState<QuickAddFormState>(() =>
    buildInitialQuickAddForm({
      accountId: "",
      categoryId: "",
      currency: "ARS",
      todayISO: getTodayISO(),
    }),
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // Once queries finish loading, fill any field the user has not touched yet.
  // We use `accountId === ""` as the proxy for "untouched" and bind currency to
  // it: while no account is selected, currency follows the default; once the
  // user picks an account, currency tracks that account (see setAccountId below).
  useEffect(() => {
    if (!isReady) return;
    setForm((current) => ({
      ...current,
      accountId: current.accountId === "" ? defaultAccountId : current.accountId,
      categoryId:
        current.categoryId === "" ? defaultCategoryId : current.categoryId,
      currency: current.accountId === "" ? defaultCurrency : current.currency,
    }));
  }, [isReady, defaultAccountId, defaultCategoryId, defaultCurrency]);

  const mutation = useMutation({
    mutationFn: walletApi.createTransaction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: walletQueryKeys.all });
    },
  });

  function reset(): void {
    setForm(
      buildInitialQuickAddForm({
        accountId: defaultAccountId,
        categoryId: defaultCategoryId,
        currency: defaultCurrency,
        todayISO: getTodayISO(),
      }),
    );
    setValidationError(null);
    mutation.reset();
  }

  async function submit(): Promise<boolean> {
    const error = validateQuickAddForm(form);
    if (error !== null) {
      setValidationError(error);
      return false;
    }
    setValidationError(null);
    try {
      await mutation.mutateAsync(buildCreateTransactionPayload(form));
      reset();
      return true;
    } catch {
      return false;
    }
  }

  const mutationError =
    mutation.error instanceof Error ? mutation.error.message : null;

  return {
    accounts,
    expenseCategories,
    form,
    isReady,
    isSubmitting: mutation.isPending,
    errorMessage: validationError ?? mutationError,
    setAmount: (value) => setForm((current) => ({ ...current, amount: value })),
    setAccountId: (value) => {
      setForm((current) => ({
        ...current,
        accountId: value,
        currency: pickDefaultCurrency(accounts, value),
      }));
    },
    setCategoryId: (value) =>
      setForm((current) => ({ ...current, categoryId: value })),
    setDescription: (value) =>
      setForm((current) => ({ ...current, description: value })),
    submit,
    reset,
  };
}
