import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { useTasksDashboardStore } from "../tasks-dashboard-context";
import { ExecutionQueuePresenter } from "./ExecutionQueuePresenter";

export function useExecutionQueuePresenter(): ExecutionQueuePresenter {
  const core = useCore();
  const store = useTasksDashboardStore();
  return usePresenter(
    (onChange) => new ExecutionQueuePresenter(onChange, store, core),
    undefined,
    [core, store],
  );
}
