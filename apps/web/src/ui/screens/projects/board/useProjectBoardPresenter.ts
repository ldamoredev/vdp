import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { ProjectBoardPresenter } from "./ProjectBoardPresenter";

export function useProjectBoardPresenter(projectId: string | null): ProjectBoardPresenter {
  const core = useCore();
  return usePresenter(
    (onChange) => new ProjectBoardPresenter(onChange, core, projectId),
    undefined,
    [core, projectId],
  );
}
