import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { LoansPresenter } from "./LoansPresenter";

export function useLoansPresenter(): LoansPresenter {
  const core = useCore();
  return usePresenter((onChange) => new LoansPresenter(onChange, core), undefined, [core]);
}
