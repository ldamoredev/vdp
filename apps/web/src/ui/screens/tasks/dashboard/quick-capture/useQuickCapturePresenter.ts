import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { useTasksDashboardStore } from "../tasks-dashboard-context";
import { QuickCapturePresenter } from "./QuickCapturePresenter";

export function useQuickCapturePresenter(): QuickCapturePresenter {
  const core = useCore();
  const store = useTasksDashboardStore();
  return usePresenter(
    (onChange) => new QuickCapturePresenter(onChange, store, core),
    undefined,
    [core, store],
  );
}
