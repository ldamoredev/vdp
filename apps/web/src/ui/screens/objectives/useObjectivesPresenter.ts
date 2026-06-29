import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { ObjectivesPresenter } from "./ObjectivesPresenter";

export function useObjectivesPresenter(): ObjectivesPresenter {
  const core = useCore();
  return usePresenter((onChange) => new ObjectivesPresenter(onChange, core), undefined, [core]);
}
