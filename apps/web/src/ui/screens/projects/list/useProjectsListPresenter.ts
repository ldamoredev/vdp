import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { ProjectsListPresenter } from "./ProjectsListPresenter";

export function useProjectsListPresenter(): ProjectsListPresenter {
  const core = useCore();
  return usePresenter(
    (onChange) => new ProjectsListPresenter(onChange, core),
    undefined,
    [core],
  );
}
