import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { useTasksDashboardStore } from "../tasks-dashboard-context";
import { DetailPanelPresenter } from "./DetailPanelPresenter";

export function useDetailPanelPresenter(): DetailPanelPresenter {
  const core = useCore();
  const store = useTasksDashboardStore();
  return usePresenter(
    (onChange) => new DetailPanelPresenter(onChange, store, core),
    undefined,
    [core, store],
  );
}
