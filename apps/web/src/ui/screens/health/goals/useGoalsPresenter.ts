import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { useHealthEvents } from "../health-events-context";
import { GoalsPresenter } from "./GoalsPresenter";

export function useGoalsPresenter(): GoalsPresenter {
  const core = useCore();
  const events = useHealthEvents();
  return usePresenter(
    (onChange) => new GoalsPresenter(onChange, core, events),
    undefined,
    [core, events],
  );
}
