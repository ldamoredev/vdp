import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { ProjectHistoryPresenter } from "./ProjectHistoryPresenter";

export function useProjectHistoryPresenter(): ProjectHistoryPresenter {
  const core = useCore();
  return usePresenter((onChange) => new ProjectHistoryPresenter(onChange, core), undefined, [core]);
}
