import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { CountersPresenter } from "./CountersPresenter";

export function useCountersPresenter(): CountersPresenter {
  const core = useCore();
  return usePresenter((onChange) => new CountersPresenter(onChange, core), undefined, [core]);
}
