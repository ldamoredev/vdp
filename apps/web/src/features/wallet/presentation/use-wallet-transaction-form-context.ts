"use client";

import {
  WalletTransactionFormActionsContext,
  WalletTransactionFormQueriesContext,
  type WalletTransactionFormActionsValue,
  type WalletTransactionFormQueriesValue,
} from "./wallet-transaction-form-context";
import { useRequiredContext } from "@/lib/react/use-required-context";

export function useWalletTransactionFormData(): WalletTransactionFormQueriesValue {
  return useRequiredContext(
    WalletTransactionFormQueriesContext,
    "useWalletTransactionFormData",
    "WalletTransactionFormProvider",
  );
}

export function useWalletTransactionFormActions(): WalletTransactionFormActionsValue {
  return useRequiredContext(
    WalletTransactionFormActionsContext,
    "useWalletTransactionFormActions",
    "WalletTransactionFormProvider",
  );
}
