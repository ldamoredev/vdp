import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { StatsPresenter } from "./StatsPresenter";

export function useStatsPresenter(): StatsPresenter {
  const core = useCore();
  return usePresenter((onChange) => new StatsPresenter(onChange, core), undefined, [core]);
}
