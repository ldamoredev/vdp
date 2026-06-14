import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { HistoryPresenter } from "./HistoryPresenter";

export function useHistoryPresenter(): HistoryPresenter {
  const core = useCore();
  return usePresenter((onChange) => new HistoryPresenter(onChange, core), undefined, [core]);
}
