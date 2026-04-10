"use client";

import { createContext } from "react";
import type {
  Account,
  AccountType,
  Category,
  CategoryStat,
  Currency,
  ExchangeRate,
  InvestmentType,
  Investment,
  MonthlyTrend,
  SavingsGoal,
  Transaction,
  TransactionType,
  WalletStatsSummary,
} from "@/lib/api/types";
import { useWalletQueries } from "./use-wallet-queries";
import { useWalletMutations } from "./use-wallet-mutations";
import { useWalletCreation } from "./use-wallet-creation";
import type {
  AccountFormState,
  CategoryFormState,
  InvestmentFormState,
  SavingsFormState,
  WalletScope,
  WalletTransactionFilters,
} from "./wallet-selectors";

export interface WalletQueriesValue {
  scope: WalletScope;
  accounts: Account[];
  categories: Category[];
  recentTransactions: Transaction[];
  statsSummary: WalletStatsSummary | undefined;
  transactions: Transaction[];
  totalTransactions: number;
  transactionFilters: WalletTransactionFilters;
  currentTransactionsPage: number;
  totalTransactionsPages: number;
  canGoPreviousTransactionsPage: boolean;
  canGoNextTransactionsPage: boolean;
  byCategory: CategoryStat[];
  monthlyTrend: MonthlyTrend[];
  exchangeRates: ExchangeRate[];
  dollarRates: ExchangeRate[];
  savingsGoals: SavingsGoal[];
  investments: Investment[];
  investmentSummary: {
    totalInvested: number;
    totalCurrent: number;
    totalReturn: string;
    positive: boolean;
  };
  showSavingsForm: boolean;
  savingsForm: SavingsFormState;
  showAccountForm: boolean;
  accountForm: AccountFormState;
  showCategoryForm: boolean;
  categoryForm: CategoryFormState;
  contributeId: string | null;
  contributeAmount: string;
  showInvestmentForm: boolean;
  investmentForm: InvestmentFormState;
  isLoadingAccounts: boolean;
  isLoadingCategories: boolean;
  isLoadingRecentTransactions: boolean;
  isLoadingStatsSummary: boolean;
  isLoadingTransactions: boolean;
  isLoadingByCategory: boolean;
  isLoadingMonthlyTrend: boolean;
  isLoadingExchangeRates: boolean;
  isLoadingSavingsGoals: boolean;
  isLoadingInvestments: boolean;
  isCreatingAccount: boolean;
  isDeletingAccount: boolean;
  isUpdatingAccount: boolean;
  isCreatingCategory: boolean;
  isDeletingTransaction: boolean;
  isUpdatingTransaction: boolean;
  isUpdatingSavingsGoal: boolean;
  isCreatingSavingsGoal: boolean;
  isContributingSavings: boolean;
  isCreatingInvestment: boolean;
  isUpdatingInvestment: boolean;
}

export interface WalletActionsValue {
  readonly toggleAccountForm: () => void;
  readonly setAccountFormField: (
    field: keyof AccountFormState,
    value: string,
  ) => void;
  readonly submitAccount: () => Promise<void>;
  readonly renameAccount: (id: string, name: string) => void;
  readonly deleteAccount: (id: string) => void;
  readonly updateAccount: (input: {
    id: string;
    data: Partial<{
      name: string;
      currency: Currency;
      type: AccountType;
      initialBalance: string;
    }>;
  }) => Promise<unknown>;

  readonly toggleCategoryForm: () => void;
  readonly setCategoryFormField: (
    field: keyof CategoryFormState,
    value: string,
  ) => void;
  readonly submitCategory: () => Promise<void>;

  readonly setTransactionType: (value: TransactionType | "") => void;
  readonly setTransactionCategoryId: (value: string) => void;
  readonly setTransactionFrom: (value: string) => void;
  readonly setTransactionTo: (value: string) => void;
  readonly previousTransactionsPage: () => void;
  readonly nextTransactionsPage: () => void;
  readonly deleteTransaction: (id: string) => void;
  readonly updateTransaction: (input: {
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
  }) => Promise<unknown>;

  readonly toggleSavingsForm: () => void;
  readonly setSavingsFormField: (
    field: keyof SavingsFormState,
    value: string,
  ) => void;
  readonly submitSavingsGoal: () => Promise<void>;
  readonly updateSavingsGoal: (input: {
    id: string;
    data: Partial<{
      name: string;
      targetAmount: string;
      deadline: string | null;
    }>;
  }) => Promise<unknown>;
  readonly startContribution: (goalId: string) => void;
  readonly cancelContribution: () => void;
  readonly setContributeAmount: (value: string) => void;
  readonly submitContribution: () => Promise<void>;

  readonly toggleInvestmentForm: () => void;
  readonly setInvestmentFormField: (
    field: keyof InvestmentFormState,
    value: string,
  ) => void;
  readonly submitInvestment: () => Promise<void>;
  readonly updateInvestment: (input: {
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
  }) => Promise<unknown>;
}

export const WalletQueriesContext = createContext<WalletQueriesValue | null>(
  null,
);
export const WalletActionsContext = createContext<WalletActionsValue | null>(
  null,
);

export function WalletProvider({
  scope,
  initialTransactionFilters,
  children,
}: {
  scope: WalletScope;
  initialTransactionFilters?: WalletTransactionFilters;
  children: React.ReactNode;
}) {
  const queries = useWalletQueries(scope, initialTransactionFilters);
  const mutations = useWalletMutations();
  const creation = useWalletCreation({
    createAccount: mutations.createAccount,
    createCategory: mutations.createCategory,
    createSavingsGoal: mutations.createSavingsGoal,
    contributeSavings: mutations.contributeSavings,
    createInvestment: mutations.createInvestment,
  });

  const queriesValue: WalletQueriesValue = {
    scope: queries.scope,
    accounts: queries.accounts,
    categories: queries.categories,
    recentTransactions: queries.recentTransactions,
    statsSummary: queries.statsSummary,
    transactions: queries.transactions,
    totalTransactions: queries.totalTransactions,
    transactionFilters: queries.transactionFilters,
    currentTransactionsPage: queries.transactionPagination.currentPage,
    totalTransactionsPages: queries.transactionPagination.totalPages,
    canGoPreviousTransactionsPage:
      queries.transactionPagination.canGoPrevious,
    canGoNextTransactionsPage: queries.transactionPagination.canGoNext,
    byCategory: queries.byCategory,
    monthlyTrend: queries.monthlyTrend,
    exchangeRates: queries.exchangeRates,
    dollarRates: queries.dollarRates,
    savingsGoals: queries.savingsGoals,
    investments: queries.investments,
    investmentSummary: queries.investmentSummary,
    showAccountForm: creation.showAccountForm,
    accountForm: creation.accountForm,
    showCategoryForm: creation.showCategoryForm,
    categoryForm: creation.categoryForm,
    showSavingsForm: creation.showSavingsForm,
    savingsForm: creation.savingsForm,
    contributeId: creation.contributeId,
    contributeAmount: creation.contributeAmount,
    showInvestmentForm: creation.showInvestmentForm,
    investmentForm: creation.investmentForm,
    isLoadingAccounts: queries.isLoadingAccounts,
    isLoadingCategories: queries.isLoadingCategories,
    isLoadingRecentTransactions: queries.isLoadingRecentTransactions,
    isLoadingStatsSummary: queries.isLoadingStatsSummary,
    isLoadingTransactions: queries.isLoadingTransactions,
    isLoadingByCategory: queries.isLoadingByCategory,
    isLoadingMonthlyTrend: queries.isLoadingMonthlyTrend,
    isLoadingExchangeRates: queries.isLoadingExchangeRates,
    isLoadingSavingsGoals: queries.isLoadingSavingsGoals,
    isLoadingInvestments: queries.isLoadingInvestments,
    isCreatingAccount: mutations.isCreatingAccount,
    isDeletingAccount: mutations.isDeletingAccount,
    isUpdatingAccount: mutations.isUpdatingAccount,
    isCreatingCategory: mutations.isCreatingCategory,
    isDeletingTransaction: mutations.isDeletingTransaction,
    isUpdatingTransaction: mutations.isUpdatingTransaction,
    isUpdatingSavingsGoal: mutations.isUpdatingSavingsGoal,
    isCreatingSavingsGoal: mutations.isCreatingSavingsGoal,
    isContributingSavings: mutations.isContributingSavings,
    isCreatingInvestment: mutations.isCreatingInvestment,
    isUpdatingInvestment: mutations.isUpdatingInvestment,
  };

  const actionsValue: WalletActionsValue = {
    toggleAccountForm: () =>
      creation.setShowAccountForm((current) => !current),
    setAccountFormField: (field, value) =>
      creation.setAccountForm((current) => ({
        ...current,
        [field]:
          field === "currency"
            ? (value as AccountFormState["currency"])
            : field === "type"
              ? (value as AccountFormState["type"])
              : value,
      })),
    submitAccount: creation.submitAccount,
    renameAccount: mutations.renameAccount,
    deleteAccount: mutations.deleteAccount,
    updateAccount: mutations.updateAccount,

    toggleCategoryForm: () =>
      creation.setShowCategoryForm((current) => !current),
    setCategoryFormField: (field, value) =>
      creation.setCategoryForm((current) => ({
        ...current,
        [field]:
          field === "type"
            ? (value as CategoryFormState["type"])
            : value,
      })),
    submitCategory: creation.submitCategory,

    setTransactionType: (value) =>
      queries.setTransactionFilters((current) => ({
        ...current,
        type: value || undefined,
        offset: "0",
      })),
    setTransactionCategoryId: (value) =>
      queries.setTransactionFilters((current) => ({
        ...current,
        categoryId: value || undefined,
        offset: "0",
      })),
    setTransactionFrom: (value) =>
      queries.setTransactionFilters((current) => ({
        ...current,
        from: value || undefined,
        offset: "0",
      })),
    setTransactionTo: (value) =>
      queries.setTransactionFilters((current) => ({
        ...current,
        to: value || undefined,
        offset: "0",
      })),
    previousTransactionsPage: () =>
      queries.setTransactionFilters((current) => ({
        ...current,
        offset: String(
          Math.max(0, Number(current.offset) - Number(current.limit)),
        ),
      })),
    nextTransactionsPage: () =>
      queries.setTransactionFilters((current) => ({
        ...current,
        offset: String(Number(current.offset) + Number(current.limit)),
      })),
    deleteTransaction: mutations.deleteTransaction,
    updateTransaction: mutations.updateTransaction,

    toggleSavingsForm: () =>
      creation.setShowSavingsForm((current) => !current),
    setSavingsFormField: (field, value) =>
      creation.setSavingsForm((current) => ({
        ...current,
        [field]: value,
      })),
    submitSavingsGoal: creation.submitSavingsGoal,
    updateSavingsGoal: mutations.updateSavingsGoal,
    startContribution: creation.setContributeId,
    cancelContribution: () => {
      creation.setContributeId(null);
      creation.setContributeAmount("");
    },
    setContributeAmount: creation.setContributeAmount,
    submitContribution: creation.submitContribution,

    toggleInvestmentForm: () =>
      creation.setShowInvestmentForm((current) => !current),
    setInvestmentFormField: (field, value) =>
      creation.setInvestmentForm((current) => ({
        ...current,
        [field]: value,
      })),
    submitInvestment: creation.submitInvestment,
    updateInvestment: mutations.updateInvestment,
  };

  return (
    <WalletActionsContext value={actionsValue}>
      <WalletQueriesContext value={queriesValue}>
        {children}
      </WalletQueriesContext>
    </WalletActionsContext>
  );
}
