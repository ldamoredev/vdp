import { usePresenter } from "@nbottarini/react-presenter";
import { useSearchParams } from "react-router";

import { useCore } from "@/CoreProvider";
import { TransactionFormPresenter } from "./TransactionFormPresenter";
import { parseWalletTransactionPrefill } from "./transaction-prefill";

export function useTransactionFormPresenter(): TransactionFormPresenter {
  const core = useCore();
  const [searchParams] = useSearchParams();
  const prefill = parseWalletTransactionPrefill(searchParams);
  return usePresenter((onChange) => new TransactionFormPresenter(onChange, core, prefill), undefined, [
    core,
    searchParams.toString(),
  ]);
}
