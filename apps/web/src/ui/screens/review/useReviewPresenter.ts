import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { useTasksEvents } from "@/TasksEventsProvider";
import { ReviewPresenter } from "./ReviewPresenter";

export function useReviewPresenter(): ReviewPresenter {
  const core = useCore();
  const events = useTasksEvents();
  return usePresenter(
    (onChange) => new ReviewPresenter(onChange, core, events),
    undefined,
    [core, events],
  );
}
