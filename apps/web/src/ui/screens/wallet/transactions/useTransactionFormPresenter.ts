import { usePresenter } from "@nbottarini/react-presenter";
import { useSearchParams } from "react-router";

import { useCore } from "@/CoreProvider";
import { TransactionFormPresenter, type TransactionFormPrefill } from "./TransactionFormPresenter";

export function useTransactionFormPresenter(): TransactionFormPresenter {
  const core = useCore();
  const [searchParams] = useSearchParams();
  const prefill = prefillFromSearchParams(searchParams);
  return usePresenter((onChange) => new TransactionFormPresenter(onChange, core, prefill), undefined, [
    core,
    searchParams.toString(),
  ]);
}

function prefillFromSearchParams(searchParams: URLSearchParams): TransactionFormPrefill {
  const type = searchParams.get("type");
  const currency = searchParams.get("currency");
  const prefill: TransactionFormPrefill = {};
  if (type === "income" || type === "expense" || type === "transfer") prefill.type = type;
  if (searchParams.has("amount")) prefill.amount = searchParams.get("amount") ?? "";
  if (currency === "ARS" || currency === "USD") prefill.currency = currency;
  if (searchParams.has("description")) prefill.description = searchParams.get("description") ?? "";
  return prefill;
}
