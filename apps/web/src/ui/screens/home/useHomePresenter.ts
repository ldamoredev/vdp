import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { useTasksEvents } from "@/TasksEventsProvider";
import { HomePresenter } from "./HomePresenter";

export function useHomePresenter(): HomePresenter {
  const core = useCore();
  const events = useTasksEvents();
  return usePresenter(
    (onChange) => new HomePresenter(onChange, core, events),
    undefined,
    [core, events],
  );
}
