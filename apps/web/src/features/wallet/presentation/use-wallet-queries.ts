"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { walletApi } from "@/lib/api/wallet";
import { walletQueryKeys } from "./wallet-query-keys";
import {
  buildInitialTransactionFilters,
  buildInvestmentSummary,
  buildTransactionPagination,
  latestDollarRates,
  type WalletScope,
  type WalletTransactionFilters,
} from "./wallet-selectors";

function scopeMatches(scope: WalletScope, allowed: WalletScope[]) {
  return allowed.includes(scope);
}

export function useWalletQueries(
  scope: WalletScope,
  initialTransactionFilters?: WalletTransactionFilters,
) {
  const [transactionFilters, setTransactionFilters] =
    useState<WalletTransactionFilters>(
      () => initialTransactionFilters ?? buildInitialTransactionFilters(),
    );

  const accountsQuery = useQuery({
    queryKey: walletQueryKeys.accounts,
    queryFn: walletApi.getAccounts,
    enabled: scopeMatches(scope, [
      "dashboard",
      "investments",
      "accounts",
      "transactions",
    ]),
  });

  const categoriesQuery = useQuery({
    queryKey: walletQueryKeys.categories,
    queryFn: () => walletApi.getCategories(),
    enabled: scopeMatches(scope, ["categories", "dashboard", "transactions"]),
  });

  const recentTransactionsQuery = useQuery({
    queryKey: walletQueryKeys.recentTransactions,
    queryFn: () => walletApi.getTransactions({ limit: "10" }),
    enabled: scope === "dashboard",
  });

  const statsSummaryQuery = useQuery({
    queryKey: walletQueryKeys.statsSummary,
    queryFn: () => walletApi.getStatsSummary(),
    enabled: scope === "dashboard",
  });

  const transactionsQuery = useQuery({
    queryKey: walletQueryKeys.transactions(transactionFilters),
    queryFn: () => walletApi.getTransactions(transactionFilters),
    enabled: scope === "transactions",
  });

  const byCategoryQuery = useQuery({
    queryKey: walletQueryKeys.statsByCategory,
    queryFn: () => walletApi.getStatsByCategory(),
    enabled: scope === "stats",
  });

  const monthlyTrendQuery = useQuery({
    queryKey: walletQueryKeys.monthlyTrend,
    queryFn: walletApi.getMonthlyTrend,
    enabled: scope === "stats",
  });

  const exchangeRatesQuery = useQuery({
    queryKey: walletQueryKeys.exchangeRates,
    queryFn: walletApi.getExchangeRates,
    enabled: scope === "stats",
  });

  const savingsQuery = useQuery({
    queryKey: walletQueryKeys.savings,
    queryFn: walletApi.getSavings,
    enabled: scope === "savings",
  });

  const investmentsQuery = useQuery({
    queryKey: walletQueryKeys.investments,
    queryFn: walletApi.getInvestments,
    enabled: scope === "investments",
  });

  const accounts = accountsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const recentTransactions = recentTransactionsQuery.data?.transactions ?? [];
  const statsSummary = statsSummaryQuery.data;
  const transactions = transactionsQuery.data?.transactions ?? [];
  const totalTransactions = transactionsQuery.data?.total ?? 0;
  const byCategory = byCategoryQuery.data ?? [];
  const monthlyTrend = monthlyTrendQuery.data ?? [];
  const exchangeRates = exchangeRatesQuery.data ?? [];
  const dollarRates = latestDollarRates(exchangeRates);
  const savingsGoals = savingsQuery.data ?? [];
  const investments = investmentsQuery.data ?? [];
  const investmentSummary = buildInvestmentSummary(investments);
  const transactionPagination = buildTransactionPagination(
    transactionFilters,
    totalTransactions,
  );

  return {
    scope,
    accounts,
    categories,
    recentTransactions,
    statsSummary,
    transactions,
    totalTransactions,
    transactionFilters,
    transactionPagination,
    byCategory,
    monthlyTrend,
    exchangeRates,
    dollarRates,
    savingsGoals,
    investments,
    investmentSummary,
    isLoadingAccounts: accountsQuery.isLoading,
    isLoadingCategories: categoriesQuery.isLoading,
    isLoadingRecentTransactions: recentTransactionsQuery.isLoading,
    isLoadingStatsSummary: statsSummaryQuery.isLoading,
    isLoadingTransactions: transactionsQuery.isLoading,
    isLoadingByCategory: byCategoryQuery.isLoading,
    isLoadingMonthlyTrend: monthlyTrendQuery.isLoading,
    isLoadingExchangeRates: exchangeRatesQuery.isLoading,
    isLoadingSavingsGoals: savingsQuery.isLoading,
    isLoadingInvestments: investmentsQuery.isLoading,
    setTransactionFilters,
  };
}
