import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { DashboardPresenter } from "./DashboardPresenter";

export function useDashboardPresenter(): DashboardPresenter {
  const core = useCore();
  return usePresenter((onChange) => new DashboardPresenter(onChange, core), undefined, [core]);
}
