import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { getTodayISO } from "@/lib/format";
import { useTasksDashboardStore } from "../tasks-dashboard-context";
import { OperationalHeaderPresenter } from "./OperationalHeaderPresenter";

export function useOperationalHeaderPresenter(): OperationalHeaderPresenter {
  const core = useCore();
  const store = useTasksDashboardStore();
  return usePresenter(
    (onChange) => new OperationalHeaderPresenter(onChange, store, core, getTodayISO()),
    undefined,
    [core, store],
  );
}
