import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { SavingsPresenter } from "./SavingsPresenter";

export function useSavingsPresenter(): SavingsPresenter {
  const core = useCore();
  return usePresenter((onChange) => new SavingsPresenter(onChange, core), undefined, [core]);
}
