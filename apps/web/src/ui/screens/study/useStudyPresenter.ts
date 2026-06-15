import { usePresenter } from "@nbottarini/react-presenter";

import { StudyPresenter } from "./StudyPresenter";

export function useStudyPresenter(): StudyPresenter {
  return usePresenter((onChange) => new StudyPresenter(onChange), undefined, []);
}
