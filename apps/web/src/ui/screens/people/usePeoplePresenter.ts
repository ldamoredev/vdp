import { usePresenter } from "@nbottarini/react-presenter";

import { PeoplePresenter } from "./PeoplePresenter";

export function usePeoplePresenter(): PeoplePresenter {
  return usePresenter((onChange) => new PeoplePresenter(onChange), undefined, []);
}
