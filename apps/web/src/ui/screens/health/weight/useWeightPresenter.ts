import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { WeightPresenter } from "./WeightPresenter";

export function useWeightPresenter(): WeightPresenter {
  const core = useCore();
  return usePresenter((onChange) => new WeightPresenter(onChange, core), undefined, [core]);
}
