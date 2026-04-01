"use client";

import { createContext } from "react";
import type { Account, Category, Transaction } from "@/lib/api/types";
import type { TransactionFormState } from "./wallet-selectors";
import { useWalletTransactionCreation } from "./use-wallet-transaction-creation";

export interface WalletTransactionFormQueriesValue {
  accounts: Account[];
  categories: Category[];
  filteredCategories: Category[];
  form: TransactionFormState;
  isLoadingAccounts: boolean;
  isLoadingCategories: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
}

export interface WalletTransactionFormActionsValue {
  readonly setFormField: (
    field: keyof TransactionFormState,
    value: string,
  ) => void;
  readonly setType: (value: Transaction["type"]) => void;
  readonly submitTransaction: () => Promise<void>;
  readonly cancel: () => void;
}

export const WalletTransactionFormQueriesContext =
  createContext<WalletTransactionFormQueriesValue | null>(null);
export const WalletTransactionFormActionsContext =
  createContext<WalletTransactionFormActionsValue | null>(null);

export function WalletTransactionFormProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const model = useWalletTransactionCreation();

  const queriesValue: WalletTransactionFormQueriesValue = {
    accounts: model.accounts,
    categories: model.categories,
    filteredCategories: model.filteredCategories,
    form: model.form,
    isLoadingAccounts: model.isLoadingAccounts,
    isLoadingCategories: model.isLoadingCategories,
    isSubmitting: model.isSubmitting,
    errorMessage: model.errorMessage,
  };

  const actionsValue: WalletTransactionFormActionsValue = {
    setFormField: model.setFormField,
    setType: (value) => model.setFormField("type", value),
    submitTransaction: model.submitTransaction,
    cancel: model.cancel,
  };

  return (
    <WalletTransactionFormActionsContext value={actionsValue}>
      <WalletTransactionFormQueriesContext value={queriesValue}>
        {children}
      </WalletTransactionFormQueriesContext>
    </WalletTransactionFormActionsContext>
  );
}
