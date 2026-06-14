import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { useTasksDashboardStore } from "../tasks-dashboard-context";
import { PlanningSignalPresenter } from "./PlanningSignalPresenter";

export function usePlanningSignalPresenter(): PlanningSignalPresenter {
  const core = useCore();
  const store = useTasksDashboardStore();
  return usePresenter(
    (onChange) => new PlanningSignalPresenter(onChange, store, core),
    undefined,
    [core, store],
  );
}
