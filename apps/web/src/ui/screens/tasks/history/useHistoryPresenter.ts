import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { useTasksEvents } from "@/TasksEventsProvider";
import { HistoryPresenter } from "./HistoryPresenter";

export function useHistoryPresenter(): HistoryPresenter {
  const core = useCore();
  const events = useTasksEvents();
  return usePresenter((onChange) => new HistoryPresenter(onChange, core, events), undefined, [core, events]);
}
