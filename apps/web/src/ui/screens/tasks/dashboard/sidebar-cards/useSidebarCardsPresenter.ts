import { usePresenter } from "@nbottarini/react-presenter";

import { getTodayISO } from "@/lib/format";
import { useTasksDashboardStore } from "../tasks-dashboard-context";
import { SidebarCardsPresenter } from "./SidebarCardsPresenter";

export function useSidebarCardsPresenter(): SidebarCardsPresenter {
  const store = useTasksDashboardStore();
  return usePresenter(
    (onChange) => new SidebarCardsPresenter(onChange, store, getTodayISO()),
    undefined,
    [store],
  );
}
