import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { TransactionFormPresenter } from "./TransactionFormPresenter";

export function useTransactionFormPresenter(): TransactionFormPresenter {
  const core = useCore();
  return usePresenter((onChange) => new TransactionFormPresenter(onChange, core), undefined, [core]);
}
