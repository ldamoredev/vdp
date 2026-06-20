import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { useTasksEvents } from "@/TasksEventsProvider";
import { BoardPresenter } from "./BoardPresenter";

export function useBoardPresenter(domain: string): BoardPresenter {
  const core = useCore();
  const events = useTasksEvents();
  return usePresenter(
    (onChange) => new BoardPresenter(onChange, core, events, domain),
    undefined,
    [core, events, domain],
  );
}
