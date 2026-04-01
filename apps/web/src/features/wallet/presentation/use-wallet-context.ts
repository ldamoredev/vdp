"use client";

import {
  WalletActionsContext,
  WalletQueriesContext,
  type WalletActionsValue,
  type WalletQueriesValue,
} from "./wallet-context";
import { useRequiredContext } from "@/lib/react/use-required-context";

export function useWalletData(): WalletQueriesValue {
  return useRequiredContext(
    WalletQueriesContext,
    "useWalletData",
    "WalletProvider",
  );
}

export function useWalletActions(): WalletActionsValue {
  return useRequiredContext(
    WalletActionsContext,
    "useWalletActions",
    "WalletProvider",
  );
}
