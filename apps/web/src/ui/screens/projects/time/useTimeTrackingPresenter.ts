import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { TimeTrackingPresenter } from "./TimeTrackingPresenter";

export function useTimeTrackingPresenter(projectId: string | null): TimeTrackingPresenter {
  const core = useCore();
  return usePresenter(
    (onChange) => new TimeTrackingPresenter(onChange, core, projectId),
    undefined,
    [core, projectId],
  );
}
