import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { getTodayISO } from "@/lib/format";
import { useTasksDashboardStore } from "../tasks-dashboard-context";
import { SidebarCardsPresenter } from "./SidebarCardsPresenter";

export function useSidebarCardsPresenter(): SidebarCardsPresenter {
  const core = useCore();
  const store = useTasksDashboardStore();
  return usePresenter(
    (onChange) => new SidebarCardsPresenter(onChange, store, core, getTodayISO()),
    undefined,
    [core, store],
  );
}
