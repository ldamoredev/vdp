import { usePresenter } from "@nbottarini/react-presenter";

import { useTasksDashboardStore } from "../tasks-dashboard-context";
import { PlanningSignalPresenter } from "./PlanningSignalPresenter";

export function usePlanningSignalPresenter(): PlanningSignalPresenter {
  const store = useTasksDashboardStore();
  return usePresenter((onChange) => new PlanningSignalPresenter(onChange, store), undefined, [store]);
}
