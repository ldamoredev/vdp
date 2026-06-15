import { usePresenter } from "@nbottarini/react-presenter";

import { WorkPresenter } from "./WorkPresenter";

export function useWorkPresenter(): WorkPresenter {
  return usePresenter((onChange) => new WorkPresenter(onChange), undefined, []);
}
