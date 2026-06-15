import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { AccountsPresenter } from "./AccountsPresenter";

export function useAccountsPresenter(): AccountsPresenter {
  const core = useCore();
  return usePresenter((onChange) => new AccountsPresenter(onChange, core), undefined, [core]);
}
