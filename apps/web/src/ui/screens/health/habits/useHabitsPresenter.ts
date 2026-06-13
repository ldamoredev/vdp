import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { useHealthEvents } from "../health-events-context";
import { HabitsPresenter } from "./HabitsPresenter";

export function useHabitsPresenter(): HabitsPresenter {
  const core = useCore();
  const events = useHealthEvents();
  return usePresenter(
    (onChange) => new HabitsPresenter(onChange, core, events),
    undefined,
    [core, events],
  );
}
