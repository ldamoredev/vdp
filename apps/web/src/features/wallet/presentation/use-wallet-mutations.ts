"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { walletApi } from "@/lib/api/wallet";
import type {
  AccountType,
  Currency,
  InvestmentType,
  TransactionType,
} from "@/lib/api/types";
import { walletQueryKeys } from "./wallet-query-keys";

export function useWalletMutations() {
  const queryClient = useQueryClient();

  const invalidateWallet = () =>
    queryClient.invalidateQueries({ queryKey: walletQueryKeys.all });

  const deleteTransactionMutation = useMutation({
    mutationFn: walletApi.deleteTransaction,
    onSuccess: invalidateWallet,
  });

  const createAccountMutation = useMutation({
    mutationFn: walletApi.createAccount,
    onSuccess: invalidateWallet,
  });

  const deleteAccountMutation = useMutation({
    mutationFn: walletApi.deleteAccount,
    onSuccess: invalidateWallet,
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        currency: Currency;
        type: AccountType;
        initialBalance: string;
      }>;
    }) => walletApi.updateAccount(id, data),
    onSuccess: invalidateWallet,
  });

  const updateTransactionMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        accountId: string;
        categoryId: string | null;
        type: TransactionType;
        amount: string;
        currency: Currency;
        description: string | null;
        date: string;
        tags: string[];
      }>;
    }) => walletApi.updateTransaction(id, data),
    onSuccess: invalidateWallet,
  });

  const createCategoryMutation = useMutation({
    mutationFn: walletApi.createCategory,
    onSuccess: invalidateWallet,
  });

  const updateSavingsGoalMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        targetAmount: string;
        deadline: string | null;
      }>;
    }) => walletApi.updateSavingsGoal(id, data),
    onSuccess: invalidateWallet,
  });

  const createSavingsGoalMutation = useMutation({
    mutationFn: walletApi.createSavingsGoal,
    onSuccess: invalidateWallet,
  });

  const contributeSavingsMutation = useMutation({
    mutationFn: ({
      id,
      amount,
      date,
      note,
    }: {
      id: string;
      amount: string;
      date?: string;
      note?: string;
    }) => walletApi.contributeSavings(id, { amount, date, note }),
    onSuccess: invalidateWallet,
  });

  const createInvestmentMutation = useMutation({
    mutationFn: walletApi.createInvestment,
    onSuccess: invalidateWallet,
  });

  const updateInvestmentMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        type: InvestmentType;
        accountId: string | null;
        currency: Currency;
        investedAmount: string;
        currentValue: string;
        startDate: string;
        endDate: string | null;
        rate: string | null;
        notes: string | null;
      }>;
    }) => walletApi.updateInvestment(id, data),
    onSuccess: invalidateWallet,
  });

  return {
    deleteTransaction: (id: string) => deleteTransactionMutation.mutate(id),
    updateTransaction: updateTransactionMutation.mutateAsync,
    createAccount: createAccountMutation.mutateAsync,
    deleteAccount: (id: string) => deleteAccountMutation.mutate(id),
    updateAccount: updateAccountMutation.mutateAsync,
    renameAccount: (id: string, name: string) =>
      updateAccountMutation.mutate({ id, data: { name } }),
    createCategory: createCategoryMutation.mutateAsync,
    updateSavingsGoal: updateSavingsGoalMutation.mutateAsync,
    createSavingsGoal: createSavingsGoalMutation.mutateAsync,
    contributeSavings: contributeSavingsMutation.mutateAsync,
    createInvestment: createInvestmentMutation.mutateAsync,
    updateInvestment: updateInvestmentMutation.mutateAsync,
    isCreatingAccount: createAccountMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending,
    isUpdatingAccount: updateAccountMutation.isPending,
    isCreatingCategory: createCategoryMutation.isPending,
    isDeletingTransaction: deleteTransactionMutation.isPending,
    isUpdatingTransaction: updateTransactionMutation.isPending,
    isUpdatingSavingsGoal: updateSavingsGoalMutation.isPending,
    isCreatingSavingsGoal: createSavingsGoalMutation.isPending,
    isContributingSavings: contributeSavingsMutation.isPending,
    isCreatingInvestment: createInvestmentMutation.isPending,
    isUpdatingInvestment: updateInvestmentMutation.isPending,
  };
}
