import { usePresenter } from "@nbottarini/react-presenter";

import { useTasksDashboardStore } from "../tasks-dashboard-context";
import { FocusRecommendationPresenter } from "./FocusRecommendationPresenter";

export function useFocusRecommendationPresenter(): FocusRecommendationPresenter {
  const store = useTasksDashboardStore();
  return usePresenter(
    (onChange) => new FocusRecommendationPresenter(onChange, store),
    undefined,
    [store],
  );
}
