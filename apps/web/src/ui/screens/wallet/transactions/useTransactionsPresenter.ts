import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import type { TransactionsInitialFilters } from "@/ui/models/wallet/TransactionsViewModel";
import { TransactionsPresenter } from "./TransactionsPresenter";

export function useTransactionsPresenter(
  initialFilters?: Partial<TransactionsInitialFilters>,
): TransactionsPresenter {
  const core = useCore();
  return usePresenter(
    (onChange) => new TransactionsPresenter(onChange, core, initialFilters),
    undefined,
    [core],
  );
}
