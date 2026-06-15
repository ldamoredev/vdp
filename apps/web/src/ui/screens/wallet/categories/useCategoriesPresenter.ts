import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { CategoriesPresenter } from "./CategoriesPresenter";

export function useCategoriesPresenter(): CategoriesPresenter {
  const core = useCore();
  return usePresenter((onChange) => new CategoriesPresenter(onChange, core), undefined, [core]);
}
